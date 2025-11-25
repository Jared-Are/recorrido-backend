import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Alumno } from '../alumnos/alumno.entity';

export enum UserStatus {
  INVITADO = 'INVITADO',
  ACTIVO = 'ACTIVO',
  BLOQUEADO = 'BLOQUEADO'
}

// Mantenemos el enum por si lo usas en otros lados, pero la entidad usará string
export enum UserRole {
  PROPIETARIO = 'propietario',
  ASISTENTE = 'asistente',
  TUTOR = 'tutor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // NUEVO: Este será el login principal
  @Column({ type: 'text', unique: true, nullable: true }) 
  username: string;

  @Column({ type: 'text', unique: true, nullable: true }) 
  telefono: string;

  @Column({ type: 'text', unique: true, nullable: true }) 
  email: string;

  @Column({ type: 'text', select: false, nullable: true }) 
  contrasena: string;
  
  @Column({ type: 'text', nullable: true })
  nombre: string;

  // 👇 1. AGREGA ESTO (TypeORM necesita saber que existe)
  @Column({ type: 'uuid', nullable: true })
  auth_user_id: string;

  // 👇 2. VERSIÓN UNIFICADA (Solo string para evitar errores)
  @Column({
    type: 'text', 
    default: 'tutor',
  })
  rol: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INVITADO,
  })
  estatus: UserStatus;

  @Column({ type: 'text', nullable: true, select: false })
  invitationToken: string;

// 👇 CAMPOS DE SEGURIDAD (Anti Fuerza Bruta)
  @Column({ type: 'int', default: 0 })
  intentosFallidos: number;

  @Column({ type: 'timestamp', nullable: true })
  bloqueadoHasta: Date;

  @CreateDateColumn()
  fechaCreacion: Date;

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