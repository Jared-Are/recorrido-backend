import { Controller, Get } from '@nestjs/common';
import { Public } from './common/public.decorator'; // <--- Importante

@Controller()
export class AppController {
  
  // Este decorador permite ver la página sin estar logueado
  @Public() 
  @Get()
  getHello(): string {
    return 'El servidor del Recorrido Escolar está funcionando correctamente 🚀';
  }
}