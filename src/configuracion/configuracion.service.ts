import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfiguracionEscolar } from './configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

// Importar entidades para estadísticas
import { Alumno } from '../alumnos/alumno.entity';
import { Pago } from '../pagos/pago.entity';
import { User } from '../users/user.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  constructor(
    @InjectRepository(ConfiguracionEscolar) private configRepository: Repository<ConfiguracionEscolar>,
    @InjectRepository(Alumno) private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Pago) private pagoRepository: Repository<Pago>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Vehiculo) private vehiculoRepository: Repository<Vehiculo>,
  ) {}

  // --- MÉTODOS DE CONFIGURACIÓN (Los que faltaban) ---

  async onModuleInit() {
    await this.findOrCreate();
  }

  async findOrCreate(): Promise<ConfiguracionEscolar> {
    const configs = await this.configRepository.find();
    if (configs.length > 0) {
      return configs[0];
    }
    const newConfig = this.configRepository.create();
    return this.configRepository.save(newConfig);
  }

  async getConfig() {
    return this.findOrCreate();
  }

  async updateConfig(dto: UpdateConfiguracionDto) {
    const config = await this.findOrCreate();
    const updatedConfig = this.configRepository.merge(config, dto);
    return this.configRepository.save(updatedConfig);
  }

  // --- MÉTODO DE ESTADÍSTICAS (El nuevo) ---
  
  async getDashboardStats() {
    // 1. Alumnos Activos
    const alumnosActivos = await this.alumnoRepository.count({ where: { activo: true } });

    // 2. Personal (Choferes + Asistentes)
    const personal = await this.userRepository.count({
        where: { rol: In(['asistente', 'chofer']) }
    });

    // 3. Vehículos Activos (Asumiendo que no tienes campo 'estado' en vehiculo, contamos todos o ajusta según tu entidad)
    // Si tu entidad Vehiculo no tiene 'estado', usa count() a secas.
    const vehiculos = await this.vehiculoRepository.count(); 

    // 4. Pagos del Mes Actual
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaHoy = new Date();
    fechaHoy.setHours(fechaHoy.getHours() - 6); // Ajuste horario
    const nombreMes = meses[fechaHoy.getMonth()];
    const anio = fechaHoy.getFullYear();
    const mesString = `${nombreMes} ${anio}`;

    const pagosMes = await this.pagoRepository.find({ where: { mes: mesString } });
    const totalPagos = pagosMes.reduce((sum, p) => sum + p.monto, 0);

    return {
      alumnosActivos,
      personal,
      vehiculos,
      pagosMesTotal: totalPagos,
      mesActual: mesString
    };
  }
}