import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionEscolar } from './configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  constructor(
    @InjectRepository(ConfiguracionEscolar)
    private configRepository: Repository<ConfiguracionEscolar>,
  ) {}

  // 1. Al iniciar el módulo, se asegura de que la fila de config exista
  async onModuleInit() {
    await this.findOrCreate();
  }

  // 2. Lógica para obtener la configuración (o crearla si no existe)
  async findOrCreate(): Promise<ConfiguracionEscolar> {
    const configs = await this.configRepository.find();
    if (configs.length > 0) {
      return configs[0]; // Devuelve la primera (y única)
    }

    // Si no existe, crea una fila vacía
    const newConfig = this.configRepository.create();
    return this.configRepository.save(newConfig);
  }

  // 3. Endpoint para que el Propietario obtenga la config
  async getConfig() {
    return this.findOrCreate();
  }

  // 4. Endpoint para que el Propietario actualice la config
  async updateConfig(dto: UpdateConfiguracionDto) {
    const config = await this.findOrCreate();
    
    // TypeORM 'merge' actualiza solo los campos que vienen en el DTO
    const updatedConfig = this.configRepository.merge(config, dto);
    
    return this.configRepository.save(updatedConfig);
  }
}