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

    // 1. Buscar si el tutor ya existe (Por teléfono)
    let usuarioTutor = await this.usersRepository.findOne({ 
      where: { telefono: telefonoTutor } 
    });

    // 2. Si no existe, lo creamos AUTOMÁTICAMENTE
    if (!usuarioTutor) {
      try {
        // Generamos un username base: "juan.perez" + números aleatorios
        const baseName = datosTutor.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
        const usernameGen = `${baseName}${randomSuffix}`;

        usuarioTutor = this.usersRepository.create({
          nombre: datosTutor.nombre,
          telefono: telefonoTutor,
          email: emailTutor, // Opcional
          username: usernameGen, // <--- AQUÍ SE GUARDA EL USUARIO
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
        throw new BadRequestException("No se pudo registrar el tutor. Verifica los datos.");
      }
    }

    // 3. Crear Alumno asociado
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