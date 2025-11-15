import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateGastoDto {
  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['combustible', 'mantenimiento', 'salarios', 'otros'])
  readonly categoria: string;

  @IsUUID() 
  @IsOptional()
  readonly vehiculoId: string; // Refactorizado (antes 'microbus')

  // --- CAMBIOS DE LÓGICA ---
  @IsNumber()
  @IsOptional() // Ahora es opcional (si es salario, se toma automático)
  readonly monto: number;

  @IsUUID()
  @IsOptional() // Es opcional (solo para salarios)
  readonly personalId: string; 
  // --- FIN DE CAMBIOS ---

  @IsDateString()
  readonly fecha: string;
}