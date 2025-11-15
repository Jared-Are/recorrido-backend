import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonalDto } from './create-personal.dto';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdatePersonalDto extends PartialType(CreatePersonalDto) {
  // Permitimos que el 'estado' se actualice por separado
  @IsString()
  @IsOptional()
  @IsIn(['activo', 'inactivo', 'eliminado'])
  readonly estado?: string;
}