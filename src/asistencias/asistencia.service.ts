import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { Between, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { CreateLoteAsistenciaDto } from './dto/create-lote-asistencia.dto';
import { Aviso } from '../avisos/aviso.entity';

// Servicios Inyectados
import { DiasNoLectivosService } from '../dias-no-lectivos/dias-no-lectivos.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Alumno)
    private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Vehiculo)
    private vehiculoRepository: Repository<Vehiculo>,
    @InjectRepository(Aviso)
    private avisoRepository: Repository<Aviso>,

    private readonly diasNoLectivosService: DiasNoLectivosService,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  // --- VALIDACIONES DE DÍA ---

  private getHoy(): { fecha: Date; fechaString: string; diaSemana: number } {
    const fecha = new Date();
    // Ajuste de zona horaria si es necesario (GTM-6)
    // fecha.setHours(fecha.getHours() - 6); 
    
    const fechaString = fecha.toISOString().split('T')[0];
    const diaSemana = fecha.getDay();
    return { fecha, fechaString, diaSemana };
  }

  private async checkEsDiaLectivo(): Promise<{
    esDiaLectivo: boolean;
    motivo: string | null;
  }> {
    const { fechaString, diaSemana } = this.getHoy();

    // 1. Fines de semana
    if (diaSemana === 0 || diaSemana === 6) {
      return { esDiaLectivo: false, motivo: 'Fin de semana' };
    }

    // 2. Días No Lectivos (Feriados/Emergencias)
    const diaNoLectivo = await this.diasNoLectivosService.checkDia(fechaString);
    if (diaNoLectivo) {
      return { esDiaLectivo: false, motivo: diaNoLectivo.motivo };
    }

    // 3. Configuración Escolar (Vacaciones)
    const config = await this.configuracionService.getConfig();

    if (config.inicioAnioEscolar && config.finAnioEscolar) {
      if (
        fechaString < config.inicioAnioEscolar ||
        fechaString > config.finAnioEscolar
      ) {
        return { esDiaLectivo: false, motivo: 'Vacaciones (Fuera del año escolar)' };
      }
    }
    
    if (config.inicioVacacionesMedioAnio && config.finVacacionesMedioAnio) {
      if (
        fechaString >= config.inicioVacacionesMedioAnio &&
        fechaString <= config.finVacacionesMedioAnio
      ) {
        return { esDiaLectivo: false, motivo: 'Vacaciones (Intersemestrales)' };
      }
    }

    return { esDiaLectivo: true, motivo: null };
  }

  private async checkAsistenciaRegistradaHoy(asistenteId: string): Promise<boolean> {
    const { fechaString } = this.getHoy();
    const count = await this.asistenciaRepository.count({
      where: {
        asistenteId,
        fecha: fechaString,
      },
    });
    return count > 0;
  }

  // --- ENDPOINTS ---

  // 1. Resumen para el Asistente
  async getResumenHoy(asistenteId: string) {
    const { fechaString } = this.getHoy();
    const { esDiaLectivo, motivo } = await this.checkEsDiaLectivo();
    const asistenciaRegistrada = await this.checkAsistenciaRegistradaHoy(asistenteId);

    const asistente = await this.userRepository.findOne({
      where: { id: asistenteId },
      relations: ['vehiculo', 'vehiculo.chofer'],
    });

    if (!asistente || !asistente.vehiculo) {
      throw new NotFoundException('Asistente no encontrado o sin vehículo asignado');
    }

    const vehiculo = asistente.vehiculo;

    // Estadísticas
    const totalAlumnos = await this.alumnoRepository.count({
      where: { vehiculoId: vehiculo.id },
    });
    
    const presentesHoy = await this.asistenciaRepository.count({
      where: { fecha: fechaString, estado: 'presente', asistenteId },
    });
    
    const ausentesHoy = await this.asistenciaRepository.count({
      where: { fecha: fechaString, estado: 'ausente', asistenteId },
    });

    // Avisos
    const avisos = await this.avisoRepository.find({
      where: [{ destinatario: 'personal' }, { destinatario: 'todos' }],
      select: ['id', 'titulo'],
      order: { fechaCreacion: 'DESC' },
      take: 5,
    });

    return {
      stats: {
        vehiculo: {
          placa: vehiculo.placa,
          choferNombre: vehiculo.chofer?.nombre || 'N/A',
          fotoUrl: vehiculo.fotoUrl || null, // <--- AQUÍ SE ENVÍA LA FOTO
        },
        totalAlumnos,
        presentesHoy,
        ausentesHoy,
      },
      avisos,
      esDiaLectivo,
      motivoNoLectivo: motivo,
      asistenciaRegistrada,
    };
  }

  // 2. Lista de Alumnos para marcar
  async getAlumnosParaAsistencia(asistenteId: string) {
    const { esDiaLectivo, motivo } = await this.checkEsDiaLectivo();
    if (!esDiaLectivo) {
      throw new BadRequestException(motivo || 'Hoy no es un día lectivo.');
    }

    const asistenciaRegistrada = await this.checkAsistenciaRegistradaHoy(asistenteId);
    if (asistenciaRegistrada) {
      throw new BadRequestException('La asistencia ya fue registrada hoy.');
    }

    const asistente = await this.userRepository.findOne({
      where: { id: asistenteId },
      relations: ['vehiculo'],
    });
    if (!asistente?.vehiculo) {
      throw new NotFoundException('Asistente sin vehículo asignado');
    }

    const alumnos = await this.alumnoRepository.find({
      where: { vehiculoId: asistente.vehiculo.id },
      select: ['id', 'nombre', 'grado', 'tutor'],
    });

    return alumnos.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      grado: a.grado || 'N/A',
      tutor: a.tutor || 'N/A',
    }));
  }

  // 3. Guardar Asistencia
  async registrarLote(loteDto: CreateLoteAsistenciaDto, asistenteId: string) {
    const { esDiaLectivo, motivo } = await this.checkEsDiaLectivo();
    if (!esDiaLectivo) throw new BadRequestException(motivo);
    
    const asistenciaRegistrada = await this.checkAsistenciaRegistradaHoy(asistenteId);
    if (asistenciaRegistrada) throw new BadRequestException('La asistencia ya fue registrada.');

    const { fechaString } = this.getHoy();
    const registros = loteDto.registros.map((r) =>
      this.asistenciaRepository.create({
        ...r,
        fecha: fechaString,
        asistenteId,
      }),
    );

    return this.asistenciaRepository.save(registros);
  }

  // 4. Historial
  async getHistorial(asistenteId: string, mes: string) {
    const [year, month] = mes.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const registros = await this.asistenciaRepository.find({
      where: {
        asistenteId,
        fecha: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        ),
      },
      relations: ['alumno'],
      order: { fecha: 'ASC' },
    });

    const diasAgrupados: Record<string, any[]> = registros.reduce(
      (acc, reg) => {
        const fecha = reg.fecha;
        if (!acc[fecha]) acc[fecha] = [];
        acc[fecha].push({
          id: reg.id,
          alumnoNombre: reg.alumno?.nombre || 'Alumno desconocido',
          presente: reg.estado === 'presente',
        });
        return acc;
      },
      {},
    );

    return Object.keys(diasAgrupados).map((fecha) => ({
      fecha,
      registros: diasAgrupados[fecha],
    }));
  }
}