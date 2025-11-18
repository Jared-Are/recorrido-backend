import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class QueryHistorialDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'El mes debe estar en formato YYYY-MM',
  })
  mes: string; // Formato YYYY-MM
}