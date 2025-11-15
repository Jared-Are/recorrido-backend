import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsIn, IsUUID} from 'class-validator';

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
  
  // --- CAMBIO AQUÍ ---
  @IsUUID() // Ahora validamos que sea un UUID
  @IsNotEmpty()
  readonly vehiculoId: string; // Antes se llamaba 'recorridoId'
}