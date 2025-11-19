import { Injectable, NotFoundException } from '@nestjs/common'; // <-- Importa NotFoundException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // Asegúrate que la ruta sea correcta

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // <-- ¡ESTO FALTABA! La inyección del repo
  ) {}

  // Método para listar todos (usado por el controlador)
  findAll() {
    return this.usersRepository.find();
  }

  // Método para buscar uno (útil tenerlo)
  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  // --- TU NUEVO MÉTODO ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Generamos un token simple
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    user.invitationToken = token;
    // Guarda el usuario actualizado con el token
    await this.usersRepository.save(user);

    // Construimos el link (Ajusta la URL a tu frontend real)
    // Ejemplo: http://localhost:3000/activar?token=... o tu dominio en Vercel
    const linkActivacion = `https://tu-web-app.com/activar?token=${token}`;

    return { 
      link: linkActivacion,
      telefono: user.telefono,
      mensaje: `Hola ${user.nombre}, te damos la bienvenida al Recorrido Escolar. Para activar tu cuenta y crear tu contraseña, entra aquí: ${linkActivacion}`
    };
  }
}