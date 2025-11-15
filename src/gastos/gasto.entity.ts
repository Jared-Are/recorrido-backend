import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Personal } from '../personal/personal.entity'; // <-- 1. IMPORTAR PERSONAL

@Entity('gastos')
export class Gasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  descripcion: string;

  @Column('varchar')
  categoria: string; 

  // --- 2. CAMBIO DE LÓGICA ---
  @Column('float', { nullable: true }) // Ahora puede ser nulo (si es salario)
  monto: number;

  @Column('date')
  fecha: string; 

  @Column('varchar', { default: 'activo' })
  estado: string; 

  // --- CAMPO REFACTORIZADO (Vehículo) ---
  @Column('uuid', { nullable: true }) 
  vehiculoId: string;
  
  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.gastos, { 
    nullable: true, 
    eager: true, // Carga el vehículo automáticamente
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  // --- 3. CAMPO Y RELACIÓN AÑADIDOS (Personal) ---
  @Column('uuid', { nullable: true }) 
  personalId: string; // Para el salario

  @ManyToOne(() => Personal, (personal) => personal.gastos, { 
    nullable: true, 
    eager: true, // Carga el objeto 'personal' automáticamente
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'personalId' })
  personal: Personal;
  // --- FIN DE CAMBIOS ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}