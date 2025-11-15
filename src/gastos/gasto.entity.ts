import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity'; // <-- 1. Importar

@Entity('gastos') // Crea la tabla 'gastos'
export class Gasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  descripcion: string;

  @Column('varchar')
  categoria: string; // 'combustible', 'mantenimiento', 'salarios', 'otros'

  // --- CAMPO MODIFICADO ---
  // Antes: @Column('varchar') recorridoId: string;
  @Column('uuid', { nullable: true }) // Ahora es un UUID y puede ser nulo
  vehiculoId: string;

  // --- RELACIÓN AÑADIDA ---
  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.gastos, { nullable: true, eager: true }) // eager: true carga el vehículo automáticamente
  vehiculo: Vehiculo;

  @Column('float')
  monto: number;

  @Column('date')
  fecha: string; // Formato YYYY-MM-DD

  @Column('varchar', { default: 'activo' })
  estado: string; // 'activo', 'inactivo', 'eliminado'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}