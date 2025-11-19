import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';
// Importa Gasto si lo tienes en tu proyecto, si no, ignora esta línea
// import { Gasto } from '../gastos/gasto.entity'; 

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
  estado: string; // 'activo' | 'en mantenimiento'

  // --- ESTO ES LO QUE FALTABA ---
  @Column({ type: 'text', nullable: true })
  fotoUrl: string;
  // -----------------------------

  // Relaciones...
  @ManyToOne(() => User, (user) => user.vehiculoAsignadoComoChofer)
  @JoinColumn({ name: 'choferId' })
  chofer: User;

  @OneToMany(() => User, (user) => user.vehiculo)
  personalAsignado: User[];

  @OneToMany(() => Alumno, (alumno) => alumno.vehiculo)
  alumnos: Alumno[];
}