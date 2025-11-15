import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehiculos') // Crea la tabla 'vehiculos'
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string; // Ej: "Microbús 01", "Bus Escolar Grande"

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

  @Column('varchar', { nullable: true })
  recorridoAsignado: string; // Ej: 'recorridoA', 'recorridoB', 'N/A'

  @Column('varchar', { default: 'activo' })
  estado: string; // 'activo', 'en mantenimiento', 'inactivo', 'eliminado'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}