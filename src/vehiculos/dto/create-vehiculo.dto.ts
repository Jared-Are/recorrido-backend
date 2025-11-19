import { IsString, IsInt, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  placa: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsInt()
  @IsOptional()
  anio?: number;

  @IsInt()
  @IsOptional()
  capacidad?: number;

  @IsString()
  @IsIn(['activo', 'en mantenimiento', 'inactivo'])
  estado: string;

  // --- AGREGAR ESTO ---
  @IsString()
  @IsOptional()
  fotoUrl?: string;
}