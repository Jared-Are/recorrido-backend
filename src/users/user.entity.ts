import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Alumno } from '../alumnos/alumno.entity';

// Enums para evitar errores de texto
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

  @Column({ nullable: true }) // Email opcional
  email: string  | null;

  @Column({ unique: true }) // Teléfono obligatorio y único
  telefono: string;

  @Column({ select: false, nullable: true }) // Contraseña opcional al inicio
  contrasena?: string;
  
  @Column()
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

  // Token para invitar por WhatsApp
  @Column({ nullable: true, select: false })
  invitationToken: string;

  // --- RELACIONES ---

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.personalAsignado, { nullable: true })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ nullable: true })
  vehiculoId: string;
  
  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.chofer)
  vehiculoAsignadoComoChofer: Vehiculo[];

  @OneToMany(() => Alumno, (alumno) => alumno.tutorUser)
  hijos: Alumno[];
}