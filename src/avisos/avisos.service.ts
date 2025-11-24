import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aviso } from './aviso.entity';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(Aviso)
    private avisoRepository: Repository<Aviso>,
  ) {}

  create(createAvisoDto: CreateAvisoDto) {
    const nuevoAviso = this.avisoRepository.create(createAvisoDto);
    return this.avisoRepository.save(nuevoAviso);
  }

  findAll() {
    return this.avisoRepository.find({
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: string) {
    const aviso = await this.avisoRepository.findOneBy({ id });
    if (!aviso) {
      throw new NotFoundException(`Aviso con ID "${id}" no encontrado`);
    }
    return aviso;
  }

  async update(id: string, updateAvisoDto: UpdateAvisoDto) {
    const aviso = await this.findOne(id);
    const updated = this.avisoRepository.merge(aviso, updateAvisoDto);
    return this.avisoRepository.save(updated);
  }

  async remove(id: string) {
    const aviso = await this.findOne(id);
    await this.avisoRepository.remove(aviso);
    return { message: 'Aviso eliminado correctamente' };
  }

  // --- MÉTODOS ESPECÍFICOS ---

  findAllParaAsistente() {
    return this.avisoRepository.find({
      where: [
        { destinatario: 'personal' },
        { destinatario: 'todos' },
      ],
      order: { fechaCreacion: 'DESC' },
    });
  }

  findAllParaTutor() {
    return this.avisoRepository.find({
      where: [
        { destinatario: 'tutores' },
        { destinatario: 'todos' },
      ],
      order: { fechaCreacion: 'DESC' },
    });
  }
}