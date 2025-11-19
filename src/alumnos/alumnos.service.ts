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

    // 1. Limpieza de datos (Sanitización)
    const telefonoTutor = datosTutor.telefono?.trim() || undefined;
    // Accedemos al email de forma segura. Casteamos a 'any' por seguridad si el DTO no se ha actualizado
    const emailTutor = (datosTutor as any).email?.trim() || undefined; 

    if (!telefonoTutor) {
       throw new BadRequestException("El teléfono del tutor es obligatorio");
    }

    // 2. Buscar si el tutor ya existe (Por teléfono)
    let usuarioTutor = await this.usersRepository.findOne({ 
      where: { telefono: telefonoTutor } 
    });

    // 3. Validación de Email:
    // Si es un usuario NUEVO y nos dan un email, verificamos que ese email no pertenezca a OTRO usuario
    if (!usuarioTutor && emailTutor) {
        const existeEmail = await this.usersRepository.findOne({ where: { email: emailTutor } });
        if (existeEmail) {
            // Si esto pasa, el frontend recibe un error 400 específico
            throw new BadRequestException(`El correo ${emailTutor} ya está registrado en el sistema con otro número de teléfono.`);
        }
    }

    // 4. Si no existe el usuario, lo creamos
    if (!usuarioTutor) {
      try {
        usuarioTutor = this.usersRepository.create({
          nombre: datosTutor.nombre,
          telefono: telefonoTutor,
          email: emailTutor, // Si es undefined, se guarda como null (correcto)
          rol: UserRole.TUTOR,
          estatus: UserStatus.INVITADO,
          contrasena: undefined, 
        });
        await this.usersRepository.save(usuarioTutor);
      } catch (error: any) {
        console.error("Error BD creando tutor:", error);
        // Manejo específico de duplicados (por si acaso falló la validación previa)
        if (error.code === '23505') { 
             throw new BadRequestException("Error: El teléfono o correo ingresado ya existe en otro usuario.");
        }
        throw new BadRequestException("No se pudo registrar el tutor. Verifica los datos.");
      }
    }

    // 5. Crear Alumno
    const newAlumno = this.alumnosRepository.create({
      ...datosAlumno,
      tutor: datosTutor.nombre, 
      tutorUser: usuarioTutor,  
      activo: true,
    });

    return this.alumnosRepository.save(newAlumno);
  }

  // --- OTROS MÉTODOS ---
  findAll(): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
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
    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }
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
    }
    return this.alumnosRepository.save(alumno);
  }

  async remove(id: string): Promise<void> {
    const alumno = await this.findOne(id);
    await this.alumnosRepository.remove(alumno);
  }
}