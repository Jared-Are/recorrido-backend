import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitud } from './solicitud.entity';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
// Importar módulos necesarios para aprobar
import { UsersModule } from '../users/users.module';
import { AlumnosModule } from '../alumnos/alumnos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitud]),
    UsersModule,
    AlumnosModule
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}