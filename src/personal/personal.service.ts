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
    private personalRepository: Repository<Personal>,
    
    @InjectRepository(User) 
    private userRepository: Repository<User>,
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

  // --- CREAR (Con Usuario Automático) ---
  async create(createPersonalDto: CreatePersonalDto): Promise<Personal> {
    const datos = createPersonalDto as any;

    // 1. Validaciones previas
    if (!datos.telefono) throw new BadRequestException("El teléfono es obligatorio.");

    // 2. Verificar si ya existe un usuario con ese teléfono
    const existeUser = await this.userRepository.findOne({ where: { telefono: datos.telefono } });
    if (existeUser) throw new BadRequestException("Ya existe un usuario registrado con este teléfono.");

    // 3. Generar Username automático (ej. carlos.perez123)
    const baseName = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.');
    const randomSuffix = Math.floor(Math.random() * 1000);
    const usernameGen = `${baseName}${randomSuffix}`;

    // 4. Crear Usuario (Login) para que pueda entrar a la App
    // Si el puesto es 'Chofer', quizás le damos rol TUTOR o ASISTENTE según tu lógica de negocio.
    // Aquí asumimos ASISTENTE para que tenga acceso, o ajusta según necesites.
    const rolUsuario = datos.puesto.toLowerCase() === 'chofer' ? UserRole.ASISTENTE : UserRole.ASISTENTE;

    const nuevoUsuario = this.userRepository.create({
        nombre: datos.nombre,
        telefono: datos.telefono,
        username: usernameGen,
        rol: rolUsuario, 
        estatus: UserStatus.INVITADO,
        contrasena: undefined
    });
    
    const usuarioGuardado = await this.userRepository.save(nuevoUsuario);

    // 5. Crear Registro de Personal vinculado al Usuario
    const newPersonal = this.personalRepository.create({
      ...createPersonalDto,
      contacto: datos.telefono, // Guardamos el teléfono en el campo contacto
      userId: usuarioGuardado.id,
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

    // Opcional: Borrar también el usuario de login asociado
    if(personal.userId) {
        await this.userRepository.delete(personal.userId);
    }
    
    await this.personalRepository.remove(personal);
  }
}