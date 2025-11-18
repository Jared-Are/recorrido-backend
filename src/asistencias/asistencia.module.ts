import { Module } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { User } from '../users/user.entity'; // Asumo
import { Alumno } from '../alumnos/alumno.entity'; // Asumo
import { Vehiculo } from '../vehiculos/vehiculo.entity'; // Asumo
import { Aviso } from '../avisos/aviso.entity'; // Asumo
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { DiasNoLectivosModule } from '../dias-no-lectivos/dias-no-lectivos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asistencia,
      User,     // Importar Repos de entidades relacionadas
      Alumno,   // que usamos en el servicio
      Vehiculo,
      Aviso,
    ]),
    // No olvides importar tu Módulo de Auth si 'AuthGuard' es global
    ConfiguracionModule,  // <-- AÑADE ESTA LÍNEA
    DiasNoLectivosModule, // <-- AÑADE ESTA LÍNEA
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService],
})
export class AsistenciaModule {}