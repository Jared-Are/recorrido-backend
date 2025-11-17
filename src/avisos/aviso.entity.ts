import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// Definimos los roles a los que puede ir un aviso
export type AvisoTarget = 'todos' | 'tutores' | 'personal';

@Entity('avisos')
export class Aviso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'todos', // Por defecto es para todos
  })
  destinatario: AvisoTarget;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  fechaCreacion: Date;
}