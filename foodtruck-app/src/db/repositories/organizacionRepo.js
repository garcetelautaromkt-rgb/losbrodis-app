import { getAll, getById, put, remove } from '../db';
import { generarId } from '../../utils/id';
import { inicioDelDia, finDelDia } from '../../utils/fechas';

const STORE_TAREAS = 'tareas';
const STORE_PUBLICACIONES = 'publicaciones';

export const PLATAFORMAS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { id: 'facebook', label: 'Facebook', emoji: '👍' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'otra', label: 'Otra', emoji: '📣' },
];

export function etiquetaPlataforma(id) {
  return PLATAFORMAS.find((p) => p.id === id) || PLATAFORMAS[4];
}

// --------------------------------------------------------------- Tareas

export async function listarTareas() {
  const tareas = await getAll(STORE_TAREAS);
  // Pendientes primero, y dentro de cada grupo por fecha más cercana.
  return tareas.sort((a, b) => {
    if (a.hecha !== b.hecha) return a.hecha ? 1 : -1;
    return new Date(a.fecha) - new Date(b.fecha);
  });
}

export async function crearTarea({ texto, fecha }) {
  const tarea = {
    id: generarId(),
    texto: texto.trim(),
    fecha: (fecha ? new Date(fecha) : new Date()).toISOString(),
    hecha: false,
    creadoEn: new Date().toISOString(),
  };
  return put(STORE_TAREAS, tarea);
}

export async function alternarTarea(id) {
  const tarea = await getById(STORE_TAREAS, id);
  if (!tarea) throw new Error('Tarea no encontrada.');
  return put(STORE_TAREAS, { ...tarea, hecha: !tarea.hecha });
}

export function eliminarTarea(id) {
  return remove(STORE_TAREAS, id);
}

// -------------------------------------------------------- Publicaciones

export async function listarPublicaciones({ desde, hasta } = {}) {
  const publicaciones = await getAll(STORE_PUBLICACIONES);
  return publicaciones
    .filter((p) => {
      const f = new Date(p.fecha);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

export async function publicacionesDelDia(fecha) {
  return listarPublicaciones({ desde: inicioDelDia(fecha), hasta: finDelDia(fecha) });
}

export async function crearPublicacion({ texto, fecha, plataforma }) {
  const publicacion = {
    id: generarId(),
    texto: texto.trim(),
    fecha: (fecha ? new Date(fecha) : new Date()).toISOString(),
    plataforma: plataforma || 'instagram',
    creadoEn: new Date().toISOString(),
  };
  return put(STORE_PUBLICACIONES, publicacion);
}

export function eliminarPublicacion(id) {
  return remove(STORE_PUBLICACIONES, id);
}
