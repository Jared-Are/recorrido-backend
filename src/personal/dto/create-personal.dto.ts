import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsIn } from 'class-validator';

export class CreatePersonalDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  // Aceptamos tanto mayúsculas como minúsculas para evitar errores
  @IsIn(['Chofer', 'Asistente', 'Administrativo', 'Otro', 'asistente', 'chofer', 'administrativo']) 
  puesto: string;

  @IsString()
  @IsNotEmpty()
  telefono: string; // Ahora sí aceptamos 'telefono' desde el front

  @IsNumber()
  @IsOptional()
  salario?: number;

  @IsUUID()
  @IsOptional() // IMPORTANTE: Opcional, porque al crear no siempre tiene vehículo
  vehiculoId?: string;

  // Campo auxiliar para crear el usuario asociado
  @IsString()
  @IsOptional()
  rol?: string;
}