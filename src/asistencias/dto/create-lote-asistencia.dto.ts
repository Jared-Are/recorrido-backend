import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAsistenciaDto } from './create-asistencia.dto';

export class CreateLoteAsistenciaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAsistenciaDto)
  registros: CreateAsistenciaDto[];
}