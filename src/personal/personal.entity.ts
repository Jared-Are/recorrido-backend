import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity'; // <-- 1. Importar

@Entity('personal') // Crea la tabla 'personal'
export class Personal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  @Column('varchar')
  puesto: string; // Ej: 'Chofer', 'Asistente', 'Administrativo'

  @Column('varchar', { nullable: true })
  contacto: string; // Teléfono

  @Column('float', { nullable: true })
  salario: number;

  @Column('date', { nullable: true })
  fechaContratacion: string; // Formato YYYY-MM-DD

  // --- CAMPO MODIFICADO ---
  // Antes: @Column('varchar') recorridoId: string;
  @Column('uuid', { nullable: true }) // Ahora es un UUID y puede ser nulo
  vehiculoId: string;

  // --- RELACIÓN AÑADIDA ---
  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.personal, { nullable: true, eager: true }) // eager: true carga el vehículo automáticamente
  vehiculo: Vehiculo;

  @Column('varchar', { default: 'activo' })
  estado: string; // 'activo', 'inactivo', 'eliminado'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}