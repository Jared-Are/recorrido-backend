import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // <-- Asegúrate de importar In
import { ConfiguracionEscolar } from './configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

// Entidades
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

  // --- AQUÍ ESTÁ LA MAGIA DE LOS DATOS ---
  async getDashboardStats() {
    console.log("📊 Calculando estadísticas del Dashboard...");

    // 1. Alumnos (Quitamos el filtro 'activo: true' temporalmente para probar)
    const alumnosTotal = await this.alumnoRepository.count();
    console.log(`   - Alumnos encontrados: ${alumnosTotal}`);

    // 2. Personal (Asistentes y Choferes)
    const personal = await this.userRepository.count({
        where: { rol: In(['asistente', 'chofer']) }
    });
    console.log(`   - Personal encontrado: ${personal}`);

    // 3. Vehículos (Contamos todos)
    const vehiculos = await this.vehiculoRepository.count();
    console.log(`   - Vehículos encontrados: ${vehiculos}`);

    // 4. Pagos del Mes Actual
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaHoy = new Date();
    // Ajuste manual de zona horaria si es necesario
    // fechaHoy.setHours(fechaHoy.getHours() - 6); 
    
    const nombreMes = meses[fechaHoy.getMonth()];
    const anio = fechaHoy.getFullYear();
    const mesString = `${nombreMes} ${anio}`; // Ej: "Noviembre 2025"

    console.log(`   - Buscando pagos para el mes exacto: "${mesString}"`);

    // Traemos todos los pagos y filtramos en JS para evitar problemas de Case Sensitivity en SQL por ahora
    const todosPagos = await this.pagoRepository.find();
    
    const pagosMes = todosPagos.filter(p => 
        p.mes.toLowerCase() === mesString.toLowerCase()
    );
    
    const totalPagos = pagosMes.reduce((sum, p) => sum + Number(p.monto), 0);
    console.log(`   - Pagos encontrados (Match): ${pagosMes.length} | Total: ${totalPagos}`);

    return {
      alumnosActivos: alumnosTotal, // Usamos el total sin filtro por ahora
      personal,
      vehiculos,
      pagosMesTotal: totalPagos,
      mesActual: mesString
    };
  }
}