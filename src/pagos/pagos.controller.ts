import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@Controller('pagos') // URL Base: /pagos
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.create(createPagoDto);
  }

  @Get()
  findAll() {
    return this.pagosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updatePagoDto: UpdatePagoDto
  ) {
    return this.pagosService.update(id, updatePagoDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagosService.remove(id);
  }
}