import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionEscolar } from './configuracion.entity';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionController } from './configuracion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionEscolar])],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService], // Exportamos el servicio por si Asistencia lo necesita
})
export class ConfiguracionModule {}