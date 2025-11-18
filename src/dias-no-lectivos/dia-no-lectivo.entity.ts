import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('dias_no_lectivos')
export class DiaNoLectivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'date', 
    unique: true // <-- Importante: Solo puede haber un registro por fecha
  })
  fecha: string; // Formato YYYY-MM-DD

  @Column({ type: 'varchar', length: 255 })
  motivo: string; // Ej: "Feriado Nacional", "Semana Santa", "Suspensión por fumigación"
}