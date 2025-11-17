import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import type { AvisoTarget } from '../aviso.entity';

export class CreateAvisoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsOptional()
  @IsString()
  @IsIn(['todos', 'tutores', 'personal'])
  destinatario?: AvisoTarget;
}