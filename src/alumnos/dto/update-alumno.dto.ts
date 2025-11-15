import { PartialType } from '@nestjs/mapped-types';
import { CreateAlumnoDto } from './create-alumno.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAlumnoDto extends PartialType(CreateAlumnoDto) {
    // PartialType hace que todos los campos de CreateAlumnoDto sean opcionales
    // Incluyendo el nuevo 'vehiculoId'.

    // Podemos añadir campos específicos que no estén en CreateDto,
    // como 'activo' si quisiéramos cambiarlo por aquí.
    @IsBoolean()
    @IsOptional()
    readonly activo?: boolean;
}