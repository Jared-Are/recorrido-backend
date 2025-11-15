import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsIn, IsUUID } from 'class-validator';

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

    // --- CAMBIO AQUÍ ---
    @IsUUID() // Ahora validamos que sea un UUID
    @IsNotEmpty()
    readonly vehiculoId: string; // Antes se llamaba 'recorridoId'
}