import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreatePersonalDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Chofer', 'Asistente', 'Administrativo', 'Otro'])
  readonly puesto: string;

  @IsString()
  @IsOptional()
  readonly contacto: string;

  @IsNumber()
  @IsOptional()
  readonly salario: number;

  @IsDateString()
  @IsOptional()
  readonly fechaContratacion: string;
  
  @IsString()
  @IsOptional()
  @IsIn(['recorridoA', 'recorridoB', 'N/A'])
  readonly recorridoAsignado: string;
}