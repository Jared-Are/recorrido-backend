import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from './alumno.entity';
import { User, UserStatus, UserRole } from '../users/user.entity'; 
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // --- CREAR (Con lógica de Tutor automático y Sanitización) ---
  async create(createAlumnoDto: CreateAlumnoDto): Promise<Alumno> {
    const { tutor: datosTutor, ...datosAlumno } = createAlumnoDto;

    // 1. SANITIZACIÓN DE DATOS (¡ESTO ES LA CLAVE!)
    // Convertimos cadenas vacías "" a undefined para evitar conflictos UNIQUE
    const telefonoTutor = datosTutor.telefono?.trim() || undefined;
    // Si el DTO no tiene email, usamos undefined. Si viene vacío "", lo forzamos a undefined.
    const emailTutor = (datosTutor as any).email?.trim() || undefined; 

    if (!telefonoTutor) {
       throw new BadRequestException("El teléfono del tutor es obligatorio");
    }

    // 2. BUSCAR SI EL TUTOR YA EXISTE (Por teléfono)
    let usuarioTutor = await this.usersRepository.findOne({ 
      where: { telefono: telefonoTutor } 
    });

    // Validar conflicto de email si es un usuario nuevo
    if (!usuarioTutor && emailTutor) {
        const existeEmail = await this.usersRepository.findOne({ where: { email: emailTutor } });
        if (existeEmail) {
            throw new BadRequestException(`El correo ${emailTutor} ya está registrado con otro usuario.`);
        }
    }

    // 3. SI NO EXISTE, CREARLO
    if (!usuarioTutor) {
      try {
        usuarioTutor = this.usersRepository.create({
          nombre: datosTutor.nombre,
          telefono: telefonoTutor, // Usamos el limpio
          email: emailTutor,       // Usamos el limpio (ahora sí permite nulos)
          rol: UserRole.TUTOR,
          estatus: UserStatus.INVITADO,
          contrasena: undefined, 
        });
        await this.usersRepository.save(usuarioTutor);
      } catch (error) {
        console.error("Error creando tutor automático:", error);
        if (error.code === '23505') { // Código de duplicado en Postgres
             throw new BadRequestException("Error de duplicidad: El teléfono o correo ya existen.");
        }
        throw new BadRequestException("Error al crear el usuario del tutor.");
      }
    }

    // 4. CREAR ALUMNO ASOCIADO
    const newAlumno = this.alumnosRepository.create({
      ...datosAlumno,
      tutor: datosTutor.nombre, 
      tutorUser: usuarioTutor,  
      activo: true,
    });

    return this.alumnosRepository.save(newAlumno);
  }

  // --- LEER TODOS ---
  findAll(): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
      relations: ['vehiculo', 'tutorUser'], 
    });
  }

  // --- LEER TODOS POR ESTADO ---
  findAllByEstado(activo: boolean): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: activo },
      order: { nombre: 'ASC' },
      relations: ['vehiculo', 'tutorUser'],
    });
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Alumno> {
    const alumno = await this.alumnosRepository.findOne({
        where: { id },
        relations: ['vehiculo', 'tutorUser']
    });
    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }
    return alumno;
  }

  // --- ACTUALIZAR ---
  async update(id: string, updateAlumnoDto: UpdateAlumnoDto): Promise<Alumno> {
    const { tutor, ...datosSimples } = updateAlumnoDto;

    const alumno = await this.alumnosRepository.preload({
      id: id,
      ...datosSimples,
    });

    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }

    if (tutor) {
        alumno.tutor = tutor.nombre;
        // Nota: Aquí también podrías actualizar datos del usuario si quisieras
    }

    return this.alumnosRepository.save(alumno);
  }

  // --- ELIMINAR ---
  async remove(id: string): Promise<void> {
    const alumno = await this.findOne(id);
    await this.alumnosRepository.remove(alumno);
  }
}