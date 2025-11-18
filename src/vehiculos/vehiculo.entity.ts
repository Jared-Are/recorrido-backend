import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Alumno } from '../alumnos/alumno.entity';
import { Personal } from '../personal/personal.entity';
import { Gasto } from '../gastos/gasto.entity';
import { User } from '../users/user.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string; // "Microbús 01", "Bus Azul y Blanco"

  @Column('varchar', { unique: true })
  placa: string;

  @Column('varchar', { nullable: true })
  marca: string;

  @Column('varchar', { nullable: true })
  modelo: string;

  @Column('int', { nullable: true })
  anio: number;

  @Column('int', { nullable: true })
  capacidad: number;

  // --- CAMPO ELIMINADO ---
  // @Column('varchar', { nullable: true })
  // recorridoAsignado: string; // <-- ESTO SE VA. No tiene sentido.

  @Column('varchar', { default: 'activo' })
  estado: string; // 'activo', 'en mantenimiento', 'inactivo', 'eliminado'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- RELACIONES AÑADIDAS ---
  // Un Vehículo puede tener muchos Alumnos
  @OneToMany(() => Alumno, (alumno) => alumno.vehiculo)
  alumnos: Alumno[];

  // Un Vehículo puede tener mucho Personal asignado
  @OneToMany(() => Personal, (personal) => personal.vehiculo)
  personal: Personal[];

  // Un Vehículo puede tener muchos Gastos
  @OneToMany(() => Gasto, (gasto) => gasto.vehiculo)
  gastos: Gasto[];

// --- AÑADE ESTO ---
  // Relación: Un Vehículo tiene UN Chofer (que es un User)
  @ManyToOne(() => User, (user) => user.vehiculoAsignadoComoChofer)
  @JoinColumn({ name: 'choferId' }) // Asumimos que quieres una columna 'choferId'
  chofer: User;

  // --- AÑADE ESTO ---
  // Relación: Un Vehículo tiene MUCHOS Asistentes (que son Users)
  @OneToMany(() => User, (user) => user.vehiculo)
  personalAsignado: User[];
}