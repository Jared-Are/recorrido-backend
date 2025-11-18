// --- IMPORTACIONES ARRIBA ---
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Asistencia } from '../asistencias/asistencia.entity';

@Entity('alumnos')
export class Alumno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  @Column('varchar')
  tutor: string;

  @Column('varchar')
  grado: string;

  @Column('varchar', { nullable: true })
  contacto: string;

  @Column('varchar')
  direccion: string;

  @Column('float', { default: 0 })
  precio: number;

  @Column('boolean', { default: true })
  activo: boolean;

  @Column('uuid', { nullable: true })
  vehiculoId: string;

  @ManyToOne(() => Vehiculo, (vehiculo: Vehiculo) => vehiculo.alumnos, {
    nullable: true,
    eager: true,
  })
  vehiculo: Vehiculo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- RELACIÓN INVERSA A ASISTENCIA (¡Esta ya está correcta!) ---
  @OneToMany(() => Asistencia, (asistencia: Asistencia) => asistencia.alumno)
  asistencias: Asistencia[];
}