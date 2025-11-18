import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // No seleccionar la contraseña por defecto
  contrasena: string;
  
  @Column()
  nombre: string;

  @Column({
    type: 'enum',
    enum: ['propietario', 'asistente', 'tutor'],
    default: 'tutor',
  })
  rol: string;

  // Relación para el Asistente: Un asistente tiene un vehículo
  // 2. Quita forwardRef()
  @ManyToOne(() => Vehiculo, (vehiculo: Vehiculo) => vehiculo.personalAsignado)
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ nullable: true })
  vehiculoId: string;
  
  // Relación para el Chofer (si el chofer también es un User)
  // 3. Quita forwardRef() y añade el tipo (user: User)
  @OneToMany(() => Vehiculo, (vehiculo: Vehiculo) => vehiculo.chofer)
  vehiculoAsignadoComoChofer: Vehiculo[];
}