import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

@Entity('alumnos')
export class Alumno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  @Column('varchar')
  tutor: string; // Nuevo

  @Column('varchar')
  grado: string; // Nuevo

  @Column('varchar')
  contacto: string; // Nuevo

  @Column('boolean', { default: true })
  activo: boolean; // Nuevo

  @Column('int', { nullable: true })
  precio: number; // Nuevo (opcional)

  @Column('varchar')
  direccion: string; // Nuevo

  @Column('varchar')
  recorridoId: string; // Nuevo

  @DeleteDateColumn()
  deletedAt: Date;
}