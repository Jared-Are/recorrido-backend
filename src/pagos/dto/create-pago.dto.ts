import { IsString, IsNotEmpty, IsInt, IsUUID, IsDateString, IsOptional, IsIn, IsNumber } from 'class-validator';

export class CreatePagoDto {
  @IsUUID()
  readonly alumnoId: string;

  @IsString()
  @IsNotEmpty()
  readonly alumnoNombre: string;

  @IsNumber()
  readonly monto: number;

  @IsString()
  @IsNotEmpty()
  readonly mes: string;

  @IsDateString() // Valida formato 'YYYY-MM-DD'
  @IsOptional()  // Permite que 'fecha' venga vacía
  readonly fecha: string;

  @IsString()
  @IsIn(['pagado', 'pendiente']) // Solo permite estos dos valores
  readonly estado: string;
}