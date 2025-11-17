import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';
import type { AvisoTarget } from '../aviso.entity';

export class UpdateAvisoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contenido?: string;

  @IsOptional()
  @IsString()
  @IsIn(['todos', 'tutores', 'personal'])
  destinatario?: AvisoTarget;
}