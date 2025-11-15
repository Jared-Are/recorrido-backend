import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  readonly placa: string;
  
  @IsString()
  @IsOptional()
  readonly marca: string;

  @IsString()
  @IsOptional()
  readonly modelo: string;

  @IsInt()
  @Min(1980)
  @Max(2030)
  @IsOptional()
  readonly anio: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  readonly capacidad: number;
  
  @IsString()
  @IsOptional()
  @IsIn(['recorridoA', 'recorridoB', 'N/A'])
  readonly recorridoAsignado: string;
}