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

  // --- CREAR ALUMNO ---
  async create(createAlumnoDto: CreateAlumnoDto): Promise<Alumno> {
    const { tutor: datosTutor, ...datosAlumno } = createAlumnoDto;

    const telefonoTutor = datosTutor.telefono?.trim() || undefined;
    const emailTutor = (datosTutor as any).email?.trim() || undefined; 

    if (!telefonoTutor) {
       throw new BadRequestException("El teléfono del tutor es obligatorio");
    }

    // 1. Buscar si el tutor ya existe
    let usuarioTutor = await this.usersRepository.findOne({ 
      where: { telefono: telefonoTutor } 
    });

    // 2. Validación de Email (si aplica)
    if (!usuarioTutor && emailTutor) {
        const existeEmail = await this.usersRepository.findOne({ where: { email: emailTutor } });
        if (existeEmail) {
            throw new BadRequestException(`El correo ${emailTutor} ya está registrado.`);
        }
    }

    // 3. Crear usuario si no existe
    if (!usuarioTutor) {
      try {
        const baseName = datosTutor.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const usernameGen = `${baseName}${randomSuffix}`;

        usuarioTutor = this.usersRepository.create({
          nombre: datosTutor.nombre,
          telefono: telefonoTutor,
          email: emailTutor,
          username: usernameGen,
          rol: UserRole.TUTOR,
          estatus: UserStatus.INVITADO,
          contrasena: undefined, 
        });
        await this.usersRepository.save(usuarioTutor);
      } catch (error: any) {
        console.error("Error BD creando tutor:", error);
        if (error.code === '23505') { 
             throw new BadRequestException("Error: El teléfono ya existe en otro usuario.");
        }
        throw new BadRequestException("No se pudo registrar el tutor.");
      }
    }

    // 4. Crear Alumno
    const newAlumno = this.alumnosRepository.create({
      ...datosAlumno,
      tutor: datosTutor.nombre, 
      tutorUser: usuarioTutor,
      // CORRECCIÓN CLAVE: Guardamos el teléfono también en la columna 'contacto' del alumno
      contacto: telefonoTutor, 
      activo: true,
    });

    return this.alumnosRepository.save(newAlumno);
  }

  // --- LEER TODOS ---
  findAll(): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
      // Importante: Traemos 'tutorUser' para leer los datos frescos del usuario
      relations: ['vehiculo', 'tutorUser'], 
    });
  }

  findAllByEstado(activo: boolean): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: activo },
      order: { nombre: 'ASC' },
      relations: ['vehiculo', 'tutorUser'],
    });
  }

  async findOne(id: string): Promise<Alumno> {
    const alumno = await this.alumnosRepository.findOne({
        where: { id },
        relations: ['vehiculo', 'tutorUser']
    });
    if (!alumno) throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    return alumno;
  }

  async update(id: string, updateAlumnoDto: UpdateAlumnoDto): Promise<Alumno> {
    const { tutor, ...datosSimples } = updateAlumnoDto;
    const alumno = await this.alumnosRepository.preload({
      id: id,
      ...datosSimples,
    });
    if (!alumno) throw new NotFoundException(`Alumno no encontrado`);

    if (tutor) {
        alumno.tutor = tutor.nombre;
        // Opcional: Actualizar también 'contacto' si cambió el tutor
        if (tutor.telefono) alumno.contacto = tutor.telefono;
    }
    return this.alumnosRepository.save(alumno);
  }

  async remove(id: string): Promise<void> {
    const alumno = await this.findOne(id);
    await this.alumnosRepository.remove(alumno);
  }
}