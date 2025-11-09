import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateAlumnoDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  readonly tutor: string;

  @IsString()
  @IsNotEmpty()
  readonly grado: string;

  @IsString()
  @IsNotEmpty()
  readonly contacto: string;

  @IsBoolean()
  @IsOptional()
  readonly activo: boolean;

  @IsInt()
  @IsOptional()
  readonly precio: number;

  @IsString()
  @IsNotEmpty()
  readonly direccion: string;

  @IsString()
  @IsIn(['recorridoA', 'recorridoB']) // Valida el tipo exacto
  readonly recorridoId: string;
}