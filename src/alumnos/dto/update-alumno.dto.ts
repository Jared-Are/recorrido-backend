import { PartialType } from '@nestjs/mapped-types';
import { CreateAlumnoDto } from './create-alumno.dto';

// UpdateAlumnoDto hereda todas las propiedades de CreateAlumnoDto,
// pero las marca todas como opcionales.
export class UpdateAlumnoDto extends PartialType(CreateAlumnoDto) {}