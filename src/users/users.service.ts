import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  findAll() {
    return this.userRepo.find({
      order: { nombre: 'ASC' }
    });
  }

  create(datos: Partial<User>) {
    const nuevo = this.userRepo.create(datos);
    return this.userRepo.save(nuevo);
  }

  async remove(id: string) {
    await this.userRepo.delete(id);
    return { message: 'Usuario eliminado' };
  }
}