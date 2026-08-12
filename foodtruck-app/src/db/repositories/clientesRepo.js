import { getAll, getAllByIndex, getById, put } from '../db';
import { generarId } from '../../utils/id';

const STORE = 'clientes';
const STORE_PAGOS = 'pagosCliente';

export async function listarClientes({ soloActivos = true } = {}) {
  const clientes = await getAll(STORE);
  const filtrados = soloActivos ? clientes.filter((c) => c.activo !== false) : clientes;
  return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function obtenerCliente(id) {
  return getById(STORE, id);
}

export async function crearCliente({ nombre, telefono }) {
  const ahora = new Date().toISOString();
  const cliente = {
    id: generarId(),
    nombre: nombre.trim(),
    telefono: (telefono || '').trim(),
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  return put(STORE, cliente);
}

export async function actualizarCliente(id, cambios) {
  const actual = await obtenerCliente(id);
  if (!actual) throw new Error('Cliente no encontrado.');
  return put(STORE, { ...actual, ...cambios, actualizadoEn: new Date().toISOString() });
}

export async function eliminarCliente(id) {
  return actualizarCliente(id, { activo: false });
}

// Registra un pago a cuenta de la deuda del cliente (fiado).
export async function registrarPago({ clienteId, monto, nota }) {
  const pago = {
    id: generarId(),
    clienteId,
    monto: Number(monto) || 0,
    nota: (nota || '').trim(),
    fecha: new Date().toISOString(),
  };
  return put(STORE_PAGOS, pago);
}

export async function listarPagos(clienteId) {
  const pagos = await getAllByIndex(STORE_PAGOS, 'clienteId', clienteId);
  return pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/** Todos los pagos de todos los clientes, para armar el resumen de deudas
 *  de una sola pasada en vez de consultar cliente por cliente. */
export function listarTodosLosPagos() {
  return getAll(STORE_PAGOS);
}

export async function totalPagado(clienteId) {
  const pagos = await listarPagos(clienteId);
  return pagos.reduce((total, p) => total + Number(p.monto), 0);
}
