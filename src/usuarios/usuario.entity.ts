import { Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // ... tus columnas (email, password, rol, etc.)
}