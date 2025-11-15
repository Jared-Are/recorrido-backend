import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column('varchar', { nullable: true })
  recorridoAsignado: string; // Ej: 'recorridoA', 'recorridoB', 'N/A'

  @Column('varchar', { default: 'activo' })
  estado: string; // 'activo', 'inactivo', 'eliminado'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}