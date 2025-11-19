import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Alumno } from '../alumnos/alumno.entity';

export enum UserStatus {
  INVITADO = 'INVITADO',
  ACTIVO = 'ACTIVO',
}

export enum UserRole {
  PROPIETARIO = 'propietario',
  ASISTENTE = 'asistente',
  TUTOR = 'tutor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // CORRECCIÓN: Agregamos { type: 'text' } para que Postgres no se confunda
  @Column({ type: 'text', unique: true, nullable: true }) 
  email: string;

  @Column({ type: 'text', unique: true }) 
  telefono: string;

  @Column({ type: 'text', select: false, nullable: true }) 
  contrasena: string;
  
  @Column({ type: 'text' })
  nombre: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INVITADO,
  })
  estatus: UserStatus;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TUTOR,
  })
  rol: UserRole;

  @Column({ type: 'text', nullable: true, select: false })
  invitationToken: string;

  // --- RELACIONES ---

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.personalAsignado, { nullable: true })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ type: 'uuid', nullable: true })
  vehiculoId: string;
  
  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.chofer)
  vehiculoAsignadoComoChofer: Vehiculo[];

  @OneToMany(() => Alumno, (alumno) => alumno.tutorUser)
  hijos: Alumno[];
}