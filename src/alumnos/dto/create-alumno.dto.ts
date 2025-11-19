import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Clase auxiliar para validar el objeto 'tutor'
class DatosTutorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;
}

export class CreateAlumnoDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  // AHORA ES UN OBJETO, NO UN STRING
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DatosTutorDto)
  readonly tutor: DatosTutorDto;

  @IsString()
  @IsNotEmpty()
  readonly grado: string;

  @IsString()
  @IsOptional()
  readonly contacto: string;

  @IsString()
  @IsNotEmpty()
  readonly direccion: string;

  @IsNumber()
  @Min(0)
  readonly precio: number;

  @IsBoolean()
  @IsOptional()
  readonly activo: boolean;

  @IsUUID()
  @IsNotEmpty()
  readonly vehiculoId: string;
}