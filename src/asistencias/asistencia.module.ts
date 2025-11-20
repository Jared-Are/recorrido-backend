// src/asistencias/asistencia.module.ts

import { Module } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity'; // <-- Solo importa su PROPIA entidad
import { Alumno } from '../alumnos/alumno.entity';
import { User } from '../users/user.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Aviso } from '../avisos/aviso.entity';

// --- IMPORTA LOS MÓDULOS DE LOS QUE DEPENDES ---
import { UsersModule } from '../users/users.module';
import { AlumnosModule } from '../alumnos/alumnos.module';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { AvisosModule } from '../avisos/avisos.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { DiasNoLectivosModule } from '../dias-no-lectivos/dias-no-lectivos.module';
import { Personal } from '../personal/personal.entity'; // <--- ¡ESTO FALTABA!


@Module({
  imports: [
    // 1. Registra SOLAMENTE la entidad 'Asistencia'
    TypeOrmModule.forFeature([Asistencia, 
      Alumno, 
      User, 
      Personal,
      Vehiculo, 
      Aviso]),

    // 2. Importa los MÓDULOS que proveen las otras entidades
    UsersModule,
    AlumnosModule,
    VehiculosModule,
    AvisosModule,
    ConfiguracionModule,
    DiasNoLectivosModule,
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService],
})
export class AsistenciaModule {}