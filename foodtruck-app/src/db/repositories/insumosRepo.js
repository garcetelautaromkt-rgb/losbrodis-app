import { getAll, getAllByIndex, getById, put } from '../db';
import { generarId } from '../../utils/id';

const STORE = 'insumos';
const STORE_MOVIMIENTOS = 'movimientosInsumo';

export const UNIDADES = ['kg', 'g', 'l', 'ml', 'unidad', 'otro'];

export async function listarInsumos({ soloActivos = true } = {}) {
  const insumos = await getAll(STORE);
  const filtrados = soloActivos ? insumos.filter((i) => i.activo !== false) : insumos;
  return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function obtenerInsumo(id) {
  return getById(STORE, id);
}

export async function crearInsumo({ nombre, unidad, stock, stockMinimo, costoUnitario }) {
  const ahora = new Date().toISOString();
  const insumo = {
    id: generarId(),
    nombre: nombre.trim(),
    unidad: unidad || 'unidad',
    stock: Number(stock) || 0,
    stockMinimo: Number(stockMinimo) || 0,
    costoUnitario: Number(costoUnitario) || 0,
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  return put(STORE, insumo);
}

export async function actualizarInsumo(id, cambios) {
  const actual = await obtenerInsumo(id);
  if (!actual) throw new Error('Insumo no encontrado.');
  const actualizado = { ...actual, ...cambios, actualizadoEn: new Date().toISOString() };
  return put(STORE, actualizado);
}

export async function eliminarInsumo(id) {
  return actualizarInsumo(id, { activo: false });
}

export function estaBajoStock(insumo) {
  return Number(insumo.stock) <= Number(insumo.stockMinimo);
}

// Suma (o resta, con delta negativo) una cantidad al stock del insumo y
// deja registrado el movimiento (compra, merma o ajuste manual) con motivo.
export async function ajustarStock(insumoId, delta, { tipo = 'ajuste', motivo = '' } = {}) {
  const insumo = await obtenerInsumo(insumoId);
  if (!insumo) throw new Error('Insumo no encontrado.');

  const nuevoStock = Math.max(0, Number(insumo.stock) + Number(delta));
  await actualizarInsumo(insumoId, { stock: nuevoStock });

  const movimiento = {
    id: generarId(),
    insumoId,
    tipo, // 'compra' | 'merma' | 'ajuste' | 'venta'
    delta: Number(delta),
    motivo: motivo.trim(),
    fecha: new Date().toISOString(),
  };
  await put(STORE_MOVIMIENTOS, movimiento);
  return { insumo: await obtenerInsumo(insumoId), movimiento };
}

export async function listarMovimientos(insumoId, { limite = 5 } = {}) {
  const movimientos = await getAllByIndex(STORE_MOVIMIENTOS, 'insumoId', insumoId);
  return movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, limite);
}
