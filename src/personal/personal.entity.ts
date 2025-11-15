import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity'; 
import { Gasto } from '../gastos/gasto.entity'; // <-- 1. IMPORTAR GASTO

@Entity('personal')
export class Personal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  nombre: string;

  @Column('varchar')
  puesto: string; 

  @Column('varchar', { nullable: true })
  contacto: string; 

  @Column('float', { nullable: true })
  salario: number;

  @Column('date', { nullable: true })
  fechaContratacion: string; 

  @Column('varchar', { default: 'activo' })
  estado: string; 

  // --- CAMPO MODIFICADO (para conectar con Vehiculo) ---
  @Column('uuid', { nullable: true }) 
  vehiculoId: string;
  
  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.personal, { 
    nullable: true, 
    eager: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  // --- RELACIÓN AÑADIDA (para conectar con Gasto) ---
  @OneToMany(() => Gasto, (gasto) => gasto.personal)
  gastos: Gasto[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}