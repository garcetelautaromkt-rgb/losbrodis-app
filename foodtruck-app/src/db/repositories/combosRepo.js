import { getAll, getById, put } from '../db';
import { generarId } from '../../utils/id';

const STORE = 'combos';

// items: [{ platoId, cantidad }]
export async function listarCombos({ soloActivos = true } = {}) {
  const combos = await getAll(STORE);
  const filtrados = soloActivos ? combos.filter((c) => c.activo !== false) : combos;
  return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function obtenerCombo(id) {
  return getById(STORE, id);
}

export async function crearCombo({ nombre, precioEspecial, items }) {
  const ahora = new Date().toISOString();
  const combo = {
    id: generarId(),
    nombre: nombre.trim(),
    precioEspecial: Number(precioEspecial) || 0,
    items: Array.isArray(items) ? items : [],
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  return put(STORE, combo);
}

export async function actualizarCombo(id, cambios) {
  const actual = await obtenerCombo(id);
  if (!actual) throw new Error('Combo no encontrado.');
  const actualizado = { ...actual, ...cambios, actualizadoEn: new Date().toISOString() };
  return put(STORE, actualizado);
}

export async function eliminarCombo(id) {
  return actualizarCombo(id, { activo: false });
}
