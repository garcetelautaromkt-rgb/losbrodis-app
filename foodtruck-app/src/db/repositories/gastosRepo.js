import { getAll, getById, put, remove } from '../db';
import { generarId } from '../../utils/id';
import { estaEnRango } from '../../utils/fechas';

const STORE = 'gastos';

export const CATEGORIAS_GASTO = [
  { id: 'insumos', label: 'Insumos', emoji: '🧺' },
  { id: 'servicios', label: 'Servicios', emoji: '💡' },
  { id: 'otros', label: 'Otros', emoji: '📦' },
];

export function etiquetaCategoria(id) {
  return CATEGORIAS_GASTO.find((c) => c.id === id) || CATEGORIAS_GASTO[2];
}

export async function listarGastos({ desde, hasta, categoria } = {}) {
  const gastos = await getAll(STORE);
  return gastos
    .filter((g) => estaEnRango(g.fecha, { desde, hasta }))
    .filter((g) => !categoria || g.categoria === categoria)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function obtenerGasto(id) {
  return getById(STORE, id);
}

export async function crearGasto({ monto, categoria, fecha, descripcion }) {
  const gasto = {
    id: generarId(),
    monto: Number(monto) || 0,
    categoria: categoria || 'otros',
    fecha: (fecha ? new Date(fecha) : new Date()).toISOString(),
    descripcion: (descripcion || '').trim(),
    creadoEn: new Date().toISOString(),
  };
  return put(STORE, gasto);
}

export async function actualizarGasto(id, cambios) {
  const actual = await obtenerGasto(id);
  if (!actual) throw new Error('Gasto no encontrado.');
  const datos = { ...actual, ...cambios };
  if (cambios.fecha) datos.fecha = new Date(cambios.fecha).toISOString();
  if (cambios.monto !== undefined) datos.monto = Number(cambios.monto) || 0;
  return put(STORE, datos);
}

export function eliminarGasto(id) {
  return remove(STORE, id);
}

export async function totalGastos({ desde, hasta } = {}) {
  const gastos = await listarGastos({ desde, hasta });
  return gastos.reduce((acc, g) => acc + Number(g.monto), 0);
}
