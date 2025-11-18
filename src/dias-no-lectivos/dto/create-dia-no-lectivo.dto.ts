import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateDiaNoLectivoDto {
  @IsDateString()
  @IsNotEmpty()
  fecha: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  motivo: string;
}