import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';

// --- 1. IMPORTAR LAS ENTIDADES FALTANTES ---
import { Gasto } from '../gastos/gasto.entity';
import { Personal } from '../personal/personal.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  @Column('varchar')
  placa: string;

  @Column('varchar')
  marca: string;

  @Column('varchar')
  modelo: string;

  @Column('int')
  anio: number;

  @Column('int')
  capacidad: number;

  @Column('varchar')
  estado: string;

  @Column({ type: 'text', nullable: true })
  fotoUrl: string;

  // --- RELACIONES ---

  // Relación con Chofer (Usuario)
  @ManyToOne(() => User, (user) => user.vehiculoAsignadoComoChofer)
  @JoinColumn({ name: 'choferId' })
  chofer: User;

  // Relación con Asistentes (Usuarios con login)
  @OneToMany(() => User, (user) => user.vehiculo)
  personalAsignado: User[];

  // Relación con Alumnos
  @OneToMany(() => Alumno, (alumno) => alumno.vehiculo)
  alumnos: Alumno[];

  // --- 2. AGREGAR ESTAS RELACIONES PARA CORREGIR EL ERROR ---
  
  // Relación con Gastos
  @OneToMany(() => Gasto, (gasto) => gasto.vehiculo)
  gastos: Gasto[];

  // Relación con Personal (Recursos Humanos / Sin login)
  @OneToMany(() => Personal, (personal) => personal.vehiculo)
  personal: Personal[];
}