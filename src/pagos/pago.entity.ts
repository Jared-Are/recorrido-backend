import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pagos') // Crea la tabla 'pagos'
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid') // Más adelante lo uniremos al Alumno
  alumnoId: string;

  @Column('varchar')
  alumnoNombre: string;

  @Column('float') // Usamos 'float' para dinero
  monto: number;

  @Column('varchar')
  mes: string;

  @Column('date', { nullable: true }) // Permite fechas nulas (para 'pendiente')
  fecha: string; 

  @Column('varchar')
  estado: string; // 'pagado' o 'pendiente'
}