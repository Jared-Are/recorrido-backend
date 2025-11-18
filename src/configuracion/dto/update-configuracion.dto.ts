import { IsDateString, IsOptional } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsDateString()
  @IsOptional()
  inicioAnioEscolar?: string;

  @IsDateString()
  @IsOptional()
  finAnioEscolar?: string;

  @IsDateString()
  @IsOptional()
  inicioVacacionesMedioAnio?: string;

  @IsDateString()
  @IsOptional()
  finVacacionesMedioAnio?: string;
}