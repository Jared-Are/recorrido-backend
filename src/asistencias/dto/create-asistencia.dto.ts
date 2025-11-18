import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator';
import type{ EstadoAsistencia } from '../asistencia.entity';

export class CreateAsistenciaDto {
  @IsString()
  @IsNotEmpty()
  alumnoId: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string; // YYYY-MM-DD

  @IsIn(['presente', 'ausente'])
  @IsNotEmpty()
  estado: EstadoAsistencia;
}