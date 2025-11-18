// --- IMPORTACIONES ARRIBA ---
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Alumno } from '../alumnos/alumno.entity';
import { User } from '../users/user.entity'; // <-- Esta es la ÚNICA importación de User

// --- CLASE STUB ELIMINADA ---
// (La clase User que estaba aquí fue borrada)

export type EstadoAsistencia = 'presente' | 'ausente';

@Entity('asistencias')
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

  // --- Relación con Alumno (¡Esta ya está correcta!) ---
  @ManyToOne(() => Alumno, (alumno: Alumno) => alumno.asistencias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumnoId' })
  alumno: Alumno;

  @Column()
  alumnoId: string;

  // --- Relación con Asistente (User) ---
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asistenteId' })
  asistente: User;

  @Column()
  asistenteId: string;

  @CreateDateColumn()
  fechaCreacion: Date;
}