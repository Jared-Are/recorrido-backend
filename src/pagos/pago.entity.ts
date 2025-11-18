import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Alumno } from '../alumnos/alumno.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  alumnoId: string;

  @Column('varchar')
  alumnoNombre: string;

  @Column('float')
  monto: number;

  @Column('varchar')
  mes: string;

  @Column('date', { nullable: true })
  fecha: string; 

  @Column('varchar')
  estado: string; // 'pagado' o 'pendiente'

  // --- ESTA ES LA CLAVE QUE FALTABA ---
  @ManyToOne(() => Alumno)
  @JoinColumn({ name: 'alumnoId' })
  alumno: Alumno;

  // Agregamos esto para poder ordenar por fecha de registro si 'fecha' es nula
  @CreateDateColumn()
  fechaRegistro: Date;
}