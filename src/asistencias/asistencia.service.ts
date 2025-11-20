import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

// Entidades
import { Asistencia } from './asistencia.entity';
import { Personal } from '../personal/personal.entity'; // <--- Usamos Personal, no User
import { Alumno } from '../alumnos/alumno.entity';
import { Aviso } from '../avisos/aviso.entity';
import { CreateLoteAsistenciaDto } from './dto/create-lote-asistencia.dto';

// Servicios Inyectados
import { DiasNoLectivosService } from '../dias-no-lectivos/dias-no-lectivos.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Personal)
    private personalRepository: Repository<Personal>, // <--- Repositorio de Personal
    @InjectRepository(Alumno)
    private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Aviso)
    private avisoRepository: Repository<Aviso>,

    private readonly diasNoLectivosService: DiasNoLectivosService,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  // --- HELPERS PRIVADOS ---

  private getHoy(): { fecha: Date; fechaString: string; diaSemana: number } {
    const fecha = new Date();
    // Ajuste de zona horaria si es necesario (ej. GTM-6)
    // fecha.setHours(fecha.getHours() - 6); 
    const fechaString = fecha.toISOString().split('T')[0];
    const diaSemana = fecha.getDay();
    return { fecha, fechaString, diaSemana };
  }

  private async checkEsDiaLectivo(): Promise<{ esDiaLectivo: boolean; motivo: string | null }> {
    const { fechaString, diaSemana } = this.getHoy();

    // 1. Fines de semana (Domingo 0, Sábado 6)
    if (diaSemana === 0 || diaSemana === 6) {
      return { esDiaLectivo: false, motivo: 'Fin de semana' };
    }

    // 2. Días No Lectivos (Feriados)
    const diaNoLectivo = await this.diasNoLectivosService.checkDia(fechaString);
    if (diaNoLectivo) {
      return { esDiaLectivo: false, motivo: diaNoLectivo.motivo };
    }

    // 3. Configuración Escolar (Vacaciones)
    const config = await this.configuracionService.getConfig();
    if (config.inicioAnioEscolar && config.finAnioEscolar) {
      if (fechaString < config.inicioAnioEscolar || fechaString > config.finAnioEscolar) {
        return { esDiaLectivo: false, motivo: 'Vacaciones (Fuera del año escolar)' };
      }
    }
    if (config.inicioVacacionesMedioAnio && config.finVacacionesMedioAnio) {
      if (fechaString >= config.inicioVacacionesMedioAnio && fechaString <= config.finVacacionesMedioAnio) {
        return { esDiaLectivo: false, motivo: 'Vacaciones (Intersemestrales)' };
      }
    }

    return { esDiaLectivo: true, motivo: null };
  }

  // Buscamos si ya existe un registro HOY para este asistente
  private async checkAsistenciaRegistradaHoy(asistenteId: string): Promise<boolean> {
    const { fechaString } = this.getHoy();
    const count = await this.asistenciaRepository.count({
      where: {
        asistente: { id: asistenteId }, // Asegúrate que la relación en Asistencia.entity se llame 'asistente'
        fecha: fechaString,
      },
    });
    return count > 0;
  }

  // Helper clave: Traduce el userId (Supabase) a un perfil de Personal
  private async getPersonalProfile(userId: string) {
    const personal = await this.personalRepository.findOne({
        where: { userId: userId },
        relations: ['vehiculo'] 
    });

    if (!personal) throw new NotFoundException('Perfil de asistente no encontrado.');
    if (!personal.vehiculo) throw new NotFoundException('No tienes vehículo asignado.');
    
    return personal;
  }

  // --- ENDPOINTS PÚBLICOS ---

  // 1. Resumen para el Asistente
  async getResumenHoy(userId: string) {
    // Recuperamos al asistente usando el token
    const asistente = await this.getPersonalProfile(userId);
    
    const { fechaString } = this.getHoy();
    const { esDiaLectivo, motivo } = await this.checkEsDiaLectivo();
    const asistenciaRegistrada = await this.checkAsistenciaRegistradaHoy(asistente.id);
    const vehiculo = asistente.vehiculo;

    // Estadísticas
    const totalAlumnos = await this.alumnoRepository.count({
      where: { vehiculo: { id: vehiculo.id } },
    });
    
    const presentesHoy = await this.asistenciaRepository.count({
      where: { fecha: fechaString, estado: 'presente', asistente: { id: asistente.id } },
    });
    
    const ausentesHoy = await this.asistenciaRepository.count({
      where: { fecha: fechaString, estado: 'ausente', asistente: { id: asistente.id } },
    });

    // Avisos
    const avisos = await this.avisoRepository.find({
      where: [{ destinatario: 'personal' }, { destinatario: 'todos' }],
      select: ['id', 'titulo', 'contenido', 'destinatario', 'fechaCreacion'],
      order: { fechaCreacion: 'DESC' },
      take: 5,
    });

    return {
      stats: {
        vehiculo: {
          placa: vehiculo.placa,
          choferNombre: asistente.nombre, // O el nombre del chofer si tienes esa relación
          fotoUrl: vehiculo.fotoUrl || null,
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
  async getAlumnosParaAsistencia(userId: string) {
    const { esDiaLectivo, motivo } = await this.checkEsDiaLectivo();
    // Puedes descomentar esto si quieres bloquear la vista en días no lectivos
    // if (!esDiaLectivo) throw new BadRequestException(motivo || 'Hoy no es un día lectivo.');

    const asistente = await this.getPersonalProfile(userId);
    const asistenciaRegistrada = await this.checkAsistenciaRegistradaHoy(asistente.id);
    
    if (asistenciaRegistrada) {
       // Opcional: lanzar error o dejar que vean la lista
       // throw new BadRequestException('La asistencia ya fue registrada hoy.');
    }

    const alumnos = await this.alumnoRepository.find({
      where: { vehiculo: { id: asistente.vehiculo.id } },
      select: ['id', 'nombre', 'grado', 'tutor'], // Ajusta según tu entidad Alumno
      order: { nombre: 'ASC' }
    });

    return alumnos.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      grado: a.grado || 'N/A',
      tutor: a.tutor ? (typeof a.tutor === 'object' ? (a.tutor as any).nombre : a.tutor) : 'N/A',
    }));
  }

  // 3. Guardar Asistencia
  async registrarLote(loteDto: CreateLoteAsistenciaDto, userId: string) {
    const { esDiaLectivo, motivo } = await this.checkEsDiaLectivo();
    if (!esDiaLectivo) throw new BadRequestException(motivo);
    
    const asistente = await this.getPersonalProfile(userId);

    const asistenciaRegistrada = await this.checkAsistenciaRegistradaHoy(asistente.id);
    if (asistenciaRegistrada) throw new BadRequestException('La asistencia ya fue registrada.');

    const { fechaString } = this.getHoy();
    
    // Creamos los registros vinculándolos al asistente
    const registros = loteDto.registros.map((r) =>
      this.asistenciaRepository.create({
        alumno: { id: r.alumnoId }, // Relación con alumno
        estado: r.estado,
        fecha: fechaString,
        asistente: { id: asistente.id }, // Relación con personal
      }),
    );

    return this.asistenciaRepository.save(registros);
  }

  // 4. Historial
  async getHistorial(userId: string, mes: string) {
    const asistente = await this.getPersonalProfile(userId);

    const [year, month] = mes.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const registros = await this.asistenciaRepository.find({
      where: {
        asistente: { id: asistente.id },
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
        const fecha = reg.fecha; // string YYYY-MM-DD
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