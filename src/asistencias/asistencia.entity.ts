import { Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('asistencias')
export class Asistencia {
  @PrimaryGeneratedColumn()
  id: number;
  // ... tus columnas
}