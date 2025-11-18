import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configuracion_escolar')
export class ConfiguracionEscolar {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Solo habrá una fila, pero TypeORM la necesita

  @Column({ type: 'date', nullable: true })
  inicioAnioEscolar: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  finAnioEscolar: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  inicioVacacionesMedioAnio: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  finVacacionesMedioAnio: string; // YYYY-MM-DD

  // Se podría añadir más, como Semana Santa, pero es mejor usar DiaNoLectivo
}