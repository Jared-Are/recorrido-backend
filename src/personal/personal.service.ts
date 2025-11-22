import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Personal } from './personal.entity';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';
import { User, UserRole, UserStatus } from '../users/user.entity';

@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(Personal)
    private personalRepository: Repository<Personal>, // Nombre oficial
    
    @InjectRepository(User) 
    private userRepository: Repository<User>,         // Nombre oficial
  ) {}

  // --- LEER TODOS (Excepto 'eliminados') ---
  findAll(): Promise<Personal[]> {
    return this.personalRepository.find({
      where: {
        estado: Not('eliminado') 
      },
      order: {
        nombre: 'ASC' 
      }
    });
  }

  // --- LEER TODOS POR ESTADO ---
  findAllByEstado(estado: string): Promise<Personal[]> {
     return this.personalRepository.find({
      where: {
        estado: estado
      },
      order: {
        nombre: 'ASC'
      }
    });
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Personal> {
    const personal = await this.personalRepository.findOneBy({ id });
    if (!personal || personal.estado === 'eliminado') {
      throw new NotFoundException(`Personal con id ${id} no encontrado`);
    }
    return personal;
  }

  // --- CREAR PERSONAL Y USUARIO (Lógica Unificada) ---
  async create(createPersonalDto: CreatePersonalDto): Promise<Personal> {
    // Casteamos a 'any' para acceder a propiedades si el DTO es estricto, o úsalas directo
    const datos = createPersonalDto as any;

    // 1. Validar teléfono
    if (!datos.telefono) throw new BadRequestException("El teléfono es obligatorio.");

    // 2. Verificar si ya existe usuario con ese teléfono
    const existeUser = await this.userRepository.findOne({ where: { telefono: datos.telefono } });
    if (existeUser) throw new BadRequestException("Ya existe un usuario registrado con este teléfono.");

    // 3. Generar Username (ej. carlos.perez123)
    const baseName = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.');
    const randomSuffix = Math.floor(Math.random() * 1000);
    const usernameGen = `${baseName}${randomSuffix}`;

    // 4. Crear Usuario (Login)
    const nuevoUsuario = this.userRepository.create({
        nombre: datos.nombre,
        telefono: datos.telefono,
        username: usernameGen,
        rol: datos.rol === 'asistente' ? UserRole.ASISTENTE : UserRole.TUTOR, 
        estatus: UserStatus.INVITADO,
        contrasena: undefined
    });
    
    const usuarioGuardado = await this.userRepository.save(nuevoUsuario);

    // 5. Crear Registro de Personal (Datos laborales) y vincular usuario
    const newPersonal = this.personalRepository.create({
      ...createPersonalDto,
      userId: usuarioGuardado.id, // ¡Vinculación clave!
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
      throw new NotFoundException(`Personal con id ${id} no encontrado`);
    }

    const personalActualizado = await this.personalRepository.preload({
      ...personalExistente,
      ...updatePersonalDto,  
    });
    
    if (!personalActualizado) {
      throw new NotFoundException(`No se pudo cargar el personal para actualizar`);
    }

    return this.personalRepository.save(personalActualizado);
  }

  // --- ELIMINAR (Borra Personal y Usuario asociado) ---
  async remove(id: string): Promise<void> {
    const personal = await this.personalRepository.findOne({ where: { id } });
    
    if (!personal) {
        throw new NotFoundException('Personal no encontrado');
    }

    // Opcional: Borrar también el usuario asociado para limpiar la tabla Users
    if(personal.userId) {
        await this.userRepository.delete(personal.userId);
    }
    
    await this.personalRepository.remove(personal);
  }
}