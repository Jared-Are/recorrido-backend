import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosController } from './alumnos.controller';
import { AlumnosService } from './alumnos.service';
import { Alumno } from './alumno.entity'; // <-- ¿Importado?

@Module({
  imports: [
    TypeOrmModule.forFeature([Alumno]) // <-- ¿Está esta línea aquí?
  ],
  controllers: [AlumnosController], // <-- ¿Está el controlador aquí?
  providers: [AlumnosService],    // <-- ¿Está el servicio aquí?
})
export class AlumnosModule {}