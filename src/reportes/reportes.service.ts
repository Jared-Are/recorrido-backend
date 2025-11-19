import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from '../pagos/pago.entity';
import { Gasto } from '../gastos/gasto.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Pago) private pagoRepo: Repository<Pago>,
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
    @InjectRepository(Asistencia) private asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Alumno) private alumnoRepo: Repository<Alumno>,
    @InjectRepository(Vehiculo) private vehiculoRepo: Repository<Vehiculo>,
  ) {}

  async getDashboardReportes() {
    // --- 1. FINANZAS POR MES (Últimos 6 meses) ---
    const pagos = await this.pagoRepo.find({ order: { fechaRegistro: 'DESC' }, take: 100 }); 
    const gastos = await this.gastoRepo.find({ order: { fecha: 'DESC' }, take: 100 });
    
    // Agrupar y sumar por mes (simplificado en JS para no complicar con SQL nativo por ahora)
    const finanzasMap = new Map();

    const procesar = (lista: any[], tipo: 'ingreso' | 'gasto') => {
        lista.forEach(item => {
            // Usa la fecha real o la fecha de registro
            const fecha = item.fecha ? new Date(item.fecha) : item.fechaRegistro;
            if(!fecha) return;
            
            const mesStr = fecha.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }); // "Nov 25"
            
            if (!finanzasMap.has(mesStr)) {
                finanzasMap.set(mesStr, { mes: mesStr, ingreso: 0, gasto: 0 });
            }
            
            const entry = finanzasMap.get(mesStr);
            if (tipo === 'ingreso') entry.ingreso += Number(item.monto);
            if (tipo === 'gasto') entry.gasto += Number(item.monto);
        });
    };

    procesar(pagos, 'ingreso');
    procesar(gastos, 'gasto');
    
    const finanzasPorMes = Array.from(finanzasMap.values()).reverse(); // Orden cronológico


    // --- 2. ESTADO DE PAGOS (Global) ---
    const totalPagado = pagos.filter(p => p.estado === 'pagado').length;
    const totalPendiente = pagos.filter(p => p.estado === 'pendiente').length;
    const estadoPagos = [
        { nombre: "Pagados", valor: totalPagado, color: "#10b981" },
        { nombre: "Pendientes", valor: totalPendiente, color: "#f59e0b" }
    ];


    // --- 3. ALUMNOS POR GRADO ---
    const alumnos = await this.alumnoRepo.find();
    const gradosMap = new Map();
    alumnos.forEach(a => {
        const grado = a.grado || "Sin Grado";
        gradosMap.set(grado, (gradosMap.get(grado) || 0) + 1);
    });
    const alumnosPorGrado = Array.from(gradosMap.entries()).map(([grado, cantidad]) => ({
        grado, alumnos: cantidad
    }));

    // --- 4. KPI TOTALES ---
    const ingresosTotales = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const gastosTotales = gastos.reduce((sum, g) => sum + Number(g.monto), 0);


    return {
        finanzasPorMes, // Para el gráfico de barras principal
        estadoPagos,    // Para la dona
        alumnosPorGrado, // Para el gráfico vertical
        kpi: {
            ingresosTotales,
            gastosTotales,
            beneficioNeto: ingresosTotales - gastosTotales
        }
    };
  }
}