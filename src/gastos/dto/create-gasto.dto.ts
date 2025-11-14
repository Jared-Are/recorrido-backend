import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateGastoDto {
  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['combustible', 'mantenimiento', 'salarios', 'otros'])
  readonly categoria: string;

  @IsString()
  @IsOptional()
  @IsIn(['Microbús 01', 'Microbús 02', 'Ambos', 'N/A'])
  readonly microbus: string;

  @IsNumber()
  readonly monto: number;

  @IsDateString()
  readonly fecha: string;
}