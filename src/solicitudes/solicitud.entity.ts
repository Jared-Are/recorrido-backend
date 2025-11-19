import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  padreNombre: string;

  @Column('varchar')
  telefono: string;

  @Column('varchar', { nullable: true }) // Opcional, por si queremos contactar por mail
  email: string;

  @Column('varchar')
  hijoNombre: string;

  @Column('varchar')
  direccion: string;

  @CreateDateColumn()
  fechaSolicitud: Date;
}