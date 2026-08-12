import { getAll, getById, put } from '../db';
import { generarId } from '../../utils/id';

const STORE = 'platos';

// receta: [{ insumoId, cantidad }] — opcional, un plato puede no tener receta cargada.
export async function listarPlatos({ soloActivos = true } = {}) {
  const platos = await getAll(STORE);
  const filtrados = soloActivos ? platos.filter((p) => p.activo !== false) : platos;
  return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function obtenerPlato(id) {
  return getById(STORE, id);
}

export async function crearPlato({ nombre, precio, categoria, foto, receta }) {
  const ahora = new Date().toISOString();
  const plato = {
    id: generarId(),
    nombre: nombre.trim(),
    precio: Number(precio) || 0,
    categoria: (categoria || '').trim(),
    foto: foto || null,
    receta: Array.isArray(receta) ? receta : [],
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  return put(STORE, plato);
}

export async function actualizarPlato(id, cambios) {
  const actual = await obtenerPlato(id);
  if (!actual) throw new Error('Plato no encontrado.');
  const actualizado = { ...actual, ...cambios, actualizadoEn: new Date().toISOString() };
  return put(STORE, actualizado);
}

export async function eliminarPlato(id) {
  return actualizarPlato(id, { activo: false });
}

export async function listarCategorias() {
  const platos = await listarPlatos();
  const categorias = new Set(platos.map((p) => p.categoria).filter(Boolean));
  return Array.from(categorias).sort((a, b) => a.localeCompare(b, 'es'));
}
