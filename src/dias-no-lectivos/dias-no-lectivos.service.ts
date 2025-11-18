import { 
  Injectable, 
  ConflictException, 
  NotFoundException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaNoLectivo } from './dia-no-lectivo.entity';
import { CreateDiaNoLectivoDto } from './dto/create-dia-no-lectivo.dto';

@Injectable()
export class DiasNoLectivosService {
  constructor(
    @InjectRepository(DiaNoLectivo)
    private diaNoLectivoRepository: Repository<DiaNoLectivo>,
  ) {}

  // 1. Crear un nuevo día no lectivo (para el Propietario)
  async create(dto: CreateDiaNoLectivoDto): Promise<DiaNoLectivo> {
    const existe = await this.diaNoLectivoRepository.findOneBy({ fecha: dto.fecha });
    if (existe) {
      throw new ConflictException(
        `Ya existe un registro para la fecha ${dto.fecha} con motivo: ${existe.motivo}`
      );
    }
    const nuevoDia = this.diaNoLectivoRepository.create(dto);
    return this.diaNoLectivoRepository.save(nuevoDia);
  }

  // 2. Obtener todos los días (para el Propietario)
  findAll() {
    return this.diaNoLectivoRepository.find({
      order: { fecha: 'DESC' },
    });
  }

  // 3. Eliminar un día (para el Propietario)
  async remove(id: string) {
    const dia = await this.diaNoLectivoRepository.findOneBy({ id });
    if (!dia) {
      throw new NotFoundException(`No se encontró el registro con ID ${id}`);
    }
    await this.diaNoLectivoRepository.remove(dia);
    return { message: 'Día no lectivo eliminado correctamente' };
  }

  // 4. LA FUNCIÓN CLAVE: Para que AsistenciaService pueda preguntar
  async checkDia(fecha: string): Promise<DiaNoLectivo | null> {
    // Busca si existe un registro para una fecha específica
    return this.diaNoLectivoRepository.findOneBy({ fecha });
  }
}