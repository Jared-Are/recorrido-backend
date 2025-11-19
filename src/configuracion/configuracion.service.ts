import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; 
import { ConfiguracionEscolar } from './configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

import { Alumno } from '../alumnos/alumno.entity';
import { Pago } from '../pagos/pago.entity';
import { User } from '../users/user.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Personal } from '../personal/personal.entity';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  constructor(
    @InjectRepository(ConfiguracionEscolar) private configRepository: Repository<ConfiguracionEscolar>,
    @InjectRepository(Alumno) private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Pago) private pagoRepository: Repository<Pago>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Vehiculo) private vehiculoRepository: Repository<Vehiculo>,
    @InjectRepository(Personal) private personalRepository: Repository<Personal>,
  ) {}

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

  // --- DIAGNÓSTICO COMPLETO ---
  async getDashboardStats() {
    console.log("========= INICIANDO REPORTE DASHBOARD =========");

    // 1. Alumnos
    const alumnosTotal = await this.alumnoRepository.count();
    console.log(`🟢 Alumnos en BD: ${alumnosTotal}`);

    // 2. Personal
    const personal = await this.personalRepository.count();
    console.log(`🟢 Personal en BD: ${personal}`);

    // 3. Vehículos
    const vehiculos = await this.vehiculoRepository.count();
    console.log(`🟢 Vehículos en BD: ${vehiculos}`);

    // 4. Pagos del Mes
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaHoy = new Date();
    // fechaHoy.setHours(fechaHoy.getHours() - 6); 
    
    const nombreMes = meses[fechaHoy.getMonth()];
    const anio = fechaHoy.getFullYear();
    const mesString = `${nombreMes} ${anio}`;
    
    console.log(`📅 Mes Buscado: "${mesString}"`);

    const todosPagos = await this.pagoRepository.find();
    console.log(`💰 Total de pagos históricos encontrados: ${todosPagos.length}`);

    const pagosMes = todosPagos.filter(p => 
        p.mes && p.mes.toLowerCase().trim() === mesString.toLowerCase().trim()
    );
    
    const totalPagos = pagosMes.reduce((sum, p) => sum + Number(p.monto), 0);
    console.log(`💰 Pagos encontrados para este mes: ${pagosMes.length} | Total Sumado: ${totalPagos}`);
    
    console.log("========= FIN REPORTE =========");

    return {
      alumnosActivos: alumnosTotal,
      personal,
      vehiculos,
      pagosMesTotal: totalPagos,
      mesActual: mesString
    };
  }
}