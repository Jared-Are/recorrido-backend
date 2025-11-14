import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoDto } from './create-gasto.dto';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateGastoDto extends PartialType(CreateGastoDto) {
  // Permitimos que el 'estado' se actualice por separado
  @IsString()
  @IsOptional()
  @IsIn(['activo', 'inactivo', 'eliminado'])
  readonly estado?: string;
}