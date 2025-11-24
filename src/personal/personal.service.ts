import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Personal } from './personal.entity';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(Personal)
    private personalRepository: Repository<Personal>,
    
    private usersService: UsersService,
  ) {}

  // --- LEER TODOS ---
  findAll(): Promise<Personal[]> {
    return this.personalRepository.find({
      where: { estado: Not('eliminado') },
      order: { nombre: 'ASC' }
    });
  }

  // --- LEER POR ESTADO ---
  findAllByEstado(estado: string): Promise<Personal[]> {
     return this.personalRepository.find({
      where: { estado: estado },
      order: { nombre: 'ASC' }
    });
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Personal> {
    const personal = await this.personalRepository.findOneBy({ id });
    if (!personal || personal.estado === 'eliminado') {
      throw new NotFoundException(`Personal no encontrado`);
    }
    return personal;
  }

  // --- CREAR (Con Usuario Automático Vía UsersService) ---
  async create(createPersonalDto: CreatePersonalDto): Promise<Personal> {
    const datos = createPersonalDto as any;

    // 1. Validaciones previas
    if (!datos.telefono) throw new BadRequestException("El teléfono es obligatorio.");

    // 2. Verificar si ya existe PERSONAL con ese teléfono
    // CORRECCIÓN: Usamos 'contacto' en lugar de 'telefono' porque así se llama en tu entidad Personal
    const existePersonal = await this.personalRepository.findOne({ where: { contacto: datos.telefono } });
    if (existePersonal) throw new BadRequestException("Ya existe un empleado registrado con este teléfono.");

    // CORRECCIÓN: Inicializamos como undefined (o string) en lugar de null para satisfacer a TypeORM
    let userId: string | undefined;

    // 3. Crear Usuario de Sistema (Login)
    try {
        console.log(`👤 Creando usuario de sistema para personal: ${datos.nombre}`);
        
        const rolAsignado = datos.puesto.toLowerCase() === 'chofer' ? 'chofer' : 'asistente';

        const nuevoUsuario = await this.usersService.create({
            nombre: datos.nombre,
            telefono: datos.telefono,
            rol: rolAsignado, 
        });
        
        userId = nuevoUsuario.id;

    } catch (error: any) {
        console.error("Error creando usuario para personal:", error.message);
        if (error.status !== 400) { 
             throw new BadRequestException("No se pudo crear el usuario de acceso. Verifica el teléfono.");
        }
    }
    
    // 4. Crear Registro de Personal vinculado al Usuario
    const newPersonal = this.personalRepository.create({
      ...createPersonalDto,
      contacto: datos.telefono, 
      userId: userId, // Ahora el tipo es correcto (string | undefined)
      estado: 'activo',
    });

    return await this.personalRepository.save(newPersonal);
  }

  // --- ACTUALIZAR ---
  async update(id: string, updatePersonalDto: UpdatePersonalDto): Promise<Personal> {
    const personalExistente = await this.personalRepository.findOne({ 
      where: { id: id },
      relations: ['vehiculo'] 
    });

    if (!personalExistente || personalExistente.estado === 'eliminado') {
      throw new NotFoundException(`Personal no encontrado`);
    }

    const personalActualizado = await this.personalRepository.preload({
      ...personalExistente,
      ...updatePersonalDto,  
    });
    
    if (!personalActualizado) throw new NotFoundException(`Error al actualizar`);

    return this.personalRepository.save(personalActualizado);
  }

  // --- ELIMINAR ---
  async remove(id: string): Promise<void> {
    const personal = await this.personalRepository.findOne({ where: { id } });
    if (!personal) throw new NotFoundException('Personal no encontrado');
    
    // Borrado lógico
    personal.estado = 'eliminado';
    await this.personalRepository.save(personal);
  }
}