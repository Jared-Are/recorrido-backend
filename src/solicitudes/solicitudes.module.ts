import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { Solicitud } from './solicitud.entity';
// IMPORTA LAS OTRAS ENTIDADES QUE USAMOS EN EL SERVICIO
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';

@Module({
  imports: [
    // AGREGA USER Y ALUMNO AQUÍ PARA QUE EL SERVICIO PUEDA USARLOS
    TypeOrmModule.forFeature([Solicitud, User, Alumno]),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}