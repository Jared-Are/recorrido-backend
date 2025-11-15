import { PartialType } from '@nestjs/mapped-types';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateVehiculoDto extends PartialType(CreateVehiculoDto) {
  @IsString()
  @IsOptional()
  @IsIn(['activo', 'en mantenimiento', 'inactivo', 'eliminado'])
  readonly estado?: string;
}