import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfiguracionEscolar } from './configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

import { Alumno } from '../alumnos/alumno.entity';
import { Pago } from '../pagos/pago.entity';
import { User } from '../users/user.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Personal } from '../personal/personal.entity'; // <--- 1. IMPORTAR

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  constructor(
    @InjectRepository(ConfiguracionEscolar) private configRepository: Repository<ConfiguracionEscolar>,
    @InjectRepository(Alumno) private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Pago) private pagoRepository: Repository<Pago>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Vehiculo) private vehiculoRepository: Repository<Vehiculo>,
    @InjectRepository(Personal) private personalRepository: Repository<Personal>, // <--- 2. INYECTAR
  ) {}

  // ... (tus métodos onModuleInit, findOrCreate, etc. SIGUEN IGUAL) ...
  async onModuleInit() { await this.findOrCreate(); }
  async findOrCreate(): Promise<ConfiguracionEscolar> {
    const configs = await this.configRepository.find();
    if (configs.length > 0) return configs[0];
    const newConfig = this.configRepository.create();
    return this.configRepository.save(newConfig);
  }
  async getConfig() { return this.findOrCreate(); }
  async updateConfig(dto: UpdateConfiguracionDto) {
    const config = await this.findOrCreate();
    const updatedConfig = this.configRepository.merge(config, dto);
    return this.configRepository.save(updatedConfig);
  }
  // ... (hasta aquí igual) ...


  // --- LÓGICA CORREGIDA ---
  async getDashboardStats() {
    // 1. Alumnos (Total en la BD)
    const alumnosActivos = await this.alumnoRepository.count();

    // 2. Personal (CORREGIDO: Contamos desde la tabla de Personal, no de Users)
    // Esto contará a Choferes, Asistentes y cualquier empleado registrado ahí.
    const personal = await this.personalRepository.count();

    // 3. Vehículos
    const vehiculos = await this.vehiculoRepository.count();

    // 4. Pagos del Mes
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaHoy = new Date();
    // fechaHoy.setHours(fechaHoy.getHours() - 6); // Ajuste horario si es necesario
    
    const nombreMes = meses[fechaHoy.getMonth()];
    const anio = fechaHoy.getFullYear();
    const mesString = `${nombreMes} ${anio}`;

    // Filtramos en memoria para asegurar coincidencia exacta
    const todosPagos = await this.pagoRepository.find();
    const pagosMes = todosPagos.filter(p => 
        p.mes.toLowerCase() === mesString.toLowerCase()
    );
    const totalPagos = pagosMes.reduce((sum, p) => sum + Number(p.monto), 0);

    return {
      alumnosActivos,
      personal,
      vehiculos,
      pagosMesTotal: totalPagos,
      mesActual: mesString
    };
  }
}