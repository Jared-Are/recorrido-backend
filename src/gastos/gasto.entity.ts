import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('gastos') // Crea la tabla 'gastos'
export class Gasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  descripcion: string;

  @Column('varchar')
  categoria: string; // 'combustible', 'mantenimiento', 'salarios', 'otros'

  @Column('varchar', { nullable: true })
  microbus: string; // 'Microbús 01', 'Microbús 02', 'Ambos', 'N/A'

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