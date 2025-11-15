import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';

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
  @IsOptional()
  readonly contacto: string;

  @IsString()
  @IsNotEmpty()
  readonly direccion: string;

  @IsNumber()
  @Min(0)
  readonly precio: number;

  @IsBoolean()
  @IsOptional() // El servicio lo pone 'true' por defecto
  readonly activo: boolean;

  // --- CAMBIO AQUÍ ---
  @IsUUID() // Ahora validamos que sea un UUID
  @IsNotEmpty()
  readonly vehiculoId: string; // Antes se llamaba 'recorridoId'
}