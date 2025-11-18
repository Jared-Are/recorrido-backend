import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { Aviso } from '../avisos/aviso.entity';
// Importa los módulos si es necesario, o usa forFeature si las entidades están disponibles
import { UsersModule } from '../users/users.module';
import { AlumnosModule } from '../alumnos/alumnos.module';
import { AvisosModule } from '../avisos/avisos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Alumno, Asistencia, Aviso]),
    UsersModule,
    AlumnosModule,
    AvisosModule
    // Importa AsistenciaModule si exporta TypeOrmModule, si no, forFeature está bien aquí
  ],
  controllers: [TutorController],
  providers: [TutorService],
})
export class TutorModule {}