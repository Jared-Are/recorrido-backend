import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosService } from './alumnos.service';
import { AlumnosController } from './alumnos.controller';
import { Alumno } from './alumno.entity';
// 1. IMPORTA LA ENTIDAD USER
import { User } from '../users/user.entity'; 

@Module({
  imports: [
    // 2. AGREGA USER AQUÍ DENTRO
    TypeOrmModule.forFeature([Alumno, User]), 
  ],
  controllers: [AlumnosController],
  providers: [AlumnosService],
  // Si necesitas usar AlumnosService en otros lados, exportalo:
  exports: [AlumnosService] 
})
export class AlumnosModule {}