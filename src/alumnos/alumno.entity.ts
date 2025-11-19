import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { User } from '../users/user.entity';

@Entity('alumnos')
export class Alumno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  // Mantenemos esta columna "vieja" para visualización rápida, 
  // pero la lógica real estará en tutorUser.
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- RELACIONES ---

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.alumnos, {
    nullable: true,
    eager: true,
  })
  vehiculo: Vehiculo;

  @OneToMany(() => Asistencia, (asistencia) => asistencia.alumno)
  asistencias: Asistencia[];

  // Relación con la cuenta de Usuario del Tutor
  @ManyToOne(() => User, (user) => user.hijos, { nullable: true, eager: true })
  @JoinColumn({ name: 'tutorUserId' })
  tutorUser: User;

  @Column({ nullable: true })
  tutorUserId: string;
}