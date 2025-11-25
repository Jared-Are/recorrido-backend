// Lógica para la promoción de alumnos
// Define la ruta de promoción: Grado Actual -> Grado Siguiente
// Si el valor es 'GRADUADO', el Alumno se marcará como activo: false.
export const GRADOS_PROMOCION: Record<string, string | null> = {
    '1° Preescolar': '2° Preescolar',
    '2° Preescolar': '3° Preescolar',
    '3° Preescolar': '1° Primaria',
    '1° Primaria': '2° Primaria',
    '2° Primaria': '3° Primaria',
    '3° Primaria': '4° Primaria',
    '4° Primaria': '5° Primaria',
    '5° Primaria': '6° Primaria',
    '6° Primaria': 'GRADUADO', // Se gradúa
};

export function getSiguienteGrado(gradoActual: string): string | null {
    // Retorna el siguiente grado o null si no existe (seguridad)
    return GRADOS_PROMOCION[gradoActual] || null;
}