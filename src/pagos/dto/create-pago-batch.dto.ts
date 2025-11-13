// src/pagos/dto/create-pago-batch.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsArray,
  ArrayMinSize,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePagoBatchDto {
  @IsUUID()
  readonly alumnoId: string;

  @IsString()
  @IsNotEmpty()
  readonly alumnoNombre: string;

  @IsNumber()
  @Min(0)
  readonly montoPorMes: number;

  @IsArray()
  @ArrayMinSize(1) // Debe venir al menos 1 mes
  @IsString({ each: true }) // Valida que cada elemento del array sea un string
  readonly meses: string[]; // Ej: ["Noviembre 2025", "Diciembre 2025"]

  @IsDateString()
  readonly fecha: string;
}