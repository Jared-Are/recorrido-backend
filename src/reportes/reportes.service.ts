import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from '../pagos/pago.entity';
import { Gasto } from '../gastos/gasto.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Pago) private pagoRepo: Repository<Pago>,
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
    @InjectRepository(Alumno) private alumnoRepo: Repository<Alumno>,
    @InjectRepository(Vehiculo) private vehiculoRepo: Repository<Vehiculo>,
  ) {}

  async getDashboardStats() {
    // 1. DATOS DE ALUMNOS (KPI: Alumnos Activos)
    // Contamos cuántos están marcados como activos en la BD
    const alumnosActivos = await this.alumnoRepo.count({ where: { activo: true } });

    // 2. DATOS FINANCIEROS (KPIs: Ingresos, Gastos, Utilidad)
    const ingresosRaw = await this.pagoRepo.find({ where: { estado: 'pagado' } });
    const gastosRaw = await this.gastoRepo.find();

    const ingresosTotales = ingresosRaw.reduce((sum, p) => sum + Number(p.monto), 0);
    const gastosTotales = gastosRaw.reduce((sum, g) => sum + Number(g.monto), 0);
    const beneficioNeto = ingresosTotales - gastosTotales;

    // 3. GRÁFICA: FINANZAS POR MES
    const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mesesMap = new Map<string, { ingreso: number; gasto: number }>();
    
    // Inicializar mapa
    mesesNombres.forEach(m => mesesMap.set(m, { ingreso: 0, gasto: 0 }));

    // Llenar Ingresos
    ingresosRaw.forEach(p => {
        const mesNombre = p.mes.split(' ')[0]; // "Febrero 2024" -> "Febrero"
        if (mesesMap.has(mesNombre)) {
            mesesMap.get(mesNombre)!.ingreso += Number(p.monto);
        }
    });

    // Llenar Gastos
    gastosRaw.forEach(g => {
        // Asumiendo fecha YYYY-MM-DD
        const fecha = new Date(g.fecha); 
        if (!isNaN(fecha.getTime())) {
            const mesNombre = mesesNombres[fecha.getMonth()];
            if (mesesMap.has(mesNombre)) {
                mesesMap.get(mesNombre)!.gasto += Number(g.monto);
            }
        }
    });

    const finanzasPorMes = Array.from(mesesMap.entries()).map(([mes, data]) => ({
        mes,
        ingreso: data.ingreso,
        gasto: data.gasto
    }));

    // 4. GRÁFICA: RENTABILIDAD POR VEHÍCULO
    const vehiculos = await this.vehiculoRepo.find();
    // Necesitamos pagos con la relación del alumno para saber su vehículo
    const pagosConRelacion = await this.pagoRepo.find({
        relations: ['alumno', 'alumno.vehiculo'],
        where: { estado: 'pagado' }
    });

    const finanzasPorVehiculo = vehiculos.map(v => {
        // Sumamos pagos de alumnos que pertenecen a este vehículo
        const ingresos = pagosConRelacion
            .filter(p => p.alumno?.vehiculo?.id === v.id)
            .reduce((sum, p) => sum + Number(p.monto), 0);
            
        // Sumamos gastos asignados a este vehículo
        const gastos = gastosRaw
            .filter(g => g.vehiculoId === v.id)
            .reduce((sum, g) => sum + Number(g.monto), 0);

        return {
            nombre: v.nombre,
            ingresos,
            gastos
        };
    });

    // 5. GRÁFICA: ALUMNOS POR GRADO
    const todosAlumnos = await this.alumnoRepo.find({ where: { activo: true } });
    const gradosMap = new Map<string, number>();
    
    todosAlumnos.forEach(a => {
        const grado = a.grado || "Sin Grado";
        gradosMap.set(grado, (gradosMap.get(grado) || 0) + 1);
    });

    const alumnosPorGrado = Array.from(gradosMap.entries()).map(([grado, cantidad]) => ({
        grado,
        alumnos: cantidad
    }));

    // 6. ESTADO DE PAGOS (Para la Dona)
    const totalPagado = ingresosRaw.length; 
    const totalPendiente = await this.pagoRepo.count({ where: { estado: 'pendiente' } }); 
    // Nota: Lo ideal sería calcular deuda real, pero por ahora usamos conteo de registros
    
    const estadoPagos = [
        { nombre: "Pagados", valor: totalPagado, color: "#10b981" },
        { nombre: "Pendientes", valor: totalPendiente, color: "#f59e0b" }
    ];

    // RETORNO FINAL
    return {
        kpi: {
            alumnosActivos, // ¡Esto arregla el 0!
            ingresosTotales,
            gastosTotales,
            beneficioNeto
        },
        finanzasPorMes,
        finanzasPorVehiculo, // ¡Esto arregla la gráfica vacía!
        alumnosPorGrado,
        estadoPagos
    };
  }
}