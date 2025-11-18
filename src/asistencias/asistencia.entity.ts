import { Alumno } from '../alumnos/alumno.entity'; // <-- Asumo que la tienes aquí
// Minimal local User entity as a stub so the relation resolves when the external module is missing.
// If you have a real users/user.entity.ts, remove this stub and restore the import above.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  nombre?: string;
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type EstadoAsistencia = 'presente' | 'ausente';

@Entity('asistencias')
// Índice para evitar duplicados: un alumno solo puede tener un registro por fecha
@Index(['fecha', 'alumnoId'], { unique: true })
export class Asistencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha: string; // Formato YYYY-MM-DD

  @Column({
    type: 'enum',
    enum: ['presente', 'ausente'],
  })
  estado: EstadoAsistencia;

  // --- Relación con Alumno ---
  @ManyToOne(() => Alumno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alumnoId' })
  alumno: Alumno;

  @Column()
  alumnoId: string;

  // --- Relación con Asistente (User) ---
  @ManyToOne(() => User, { onDelete: 'SET NULL' }) // Si se borra el user, el registro queda
  @JoinColumn({ name: 'asistenteId' })
  asistente: User;

  @Column()
  asistenteId: string;

  @CreateDateColumn()
  fechaCreacion: Date;
}