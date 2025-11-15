import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity'; // <-- 1. Importar

@Entity('alumnos')
export class Alumno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  // ... (tutor, grado, contacto, direccion, precio, activo, etc. siguen igual)
  @Column('varchar')
  tutor: string;

  @Column('varchar')
  grado: string;

  @Column('varchar', { nullable: true })
  contacto: string;

  @Column('varchar')
  direccion: string;

  @Column('float')
  precio: number;

  @Column('boolean', { default: true })
  activo: boolean;

  // --- CAMPO MODIFICADO ---
  // Antes: @Column('varchar') recorridoId: string;
  @Column('uuid', { nullable: true }) // Ahora es un UUID y puede ser nulo
  vehiculoId: string;

  // --- RELACIÓN AÑADIDA ---
  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.alumnos, { nullable: true, eager: true }) // eager: true carga el vehículo automáticamente
  vehiculo: Vehiculo;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}