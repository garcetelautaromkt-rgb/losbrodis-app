import { getAll, getAllByIndex, getById, put } from '../db';
import { generarId } from '../../utils/id';
import { listarPlatos } from './platosRepo';
import { listarCombos } from './combosRepo';
import { ajustarStock } from './insumosRepo';
import { totalPagado, listarTodosLosPagos } from './clientesRepo';
import { estaEnRango } from '../../utils/fechas';

const STORE = 'ventas';

// Un ítem del carrito: { tipo: 'plato'|'combo', refId, nombre, precioUnitario, cantidad }

/**
 * Calcula cuánto de cada insumo consume un carrito, recorriendo la receta de
 * cada plato (y, en el caso de un combo, la receta de cada plato que incluye).
 * Devuelve un Map insumoId -> cantidad total consumida.
 */
export function calcularConsumoInsumos(items, platos, combos) {
  const consumo = new Map();

  const sumar = (insumoId, cantidad) => {
    consumo.set(insumoId, (consumo.get(insumoId) || 0) + cantidad);
  };

  const sumarRecetaDePlato = (platoId, multiplicador) => {
    const plato = platos.find((p) => p.id === platoId);
    if (!plato) return;
    (plato.receta || []).forEach((linea) => {
      sumar(linea.insumoId, Number(linea.cantidad) * multiplicador);
    });
  };

  items.forEach((item) => {
    const cantidad = Number(item.cantidad) || 0;
    if (item.tipo === 'plato') {
      sumarRecetaDePlato(item.refId, cantidad);
      return;
    }
    const combo = combos.find((c) => c.id === item.refId);
    if (!combo) return;
    (combo.items || []).forEach((linea) => {
      sumarRecetaDePlato(linea.platoId, Number(linea.cantidad) * cantidad);
    });
  });

  return consumo;
}

/**
 * Insumos que quedarían en negativo si se cierra esta venta. No bloquea la
 * venta (en un puesto no se le puede decir "esperá" al cliente), solo sirve
 * para mostrar un aviso.
 */
export function detectarStockInsuficiente(items, platos, combos, insumos) {
  const consumo = calcularConsumoInsumos(items, platos, combos);
  const faltantes = [];
  consumo.forEach((cantidad, insumoId) => {
    const insumo = insumos.find((i) => i.id === insumoId);
    if (insumo && Number(insumo.stock) < cantidad) {
      faltantes.push({ insumo, necesario: cantidad, disponible: Number(insumo.stock) });
    }
  });
  return faltantes;
}

export async function crearVenta({ items, tipoPago, medioPago, clienteId, nota }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La venta no tiene ítems.');
  }

  const itemsConSubtotal = items.map((item) => ({
    tipo: item.tipo,
    refId: item.refId,
    nombre: item.nombre,
    precioUnitario: Number(item.precioUnitario) || 0,
    cantidad: Number(item.cantidad) || 0,
    subtotal: (Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0),
  }));

  const total = itemsConSubtotal.reduce((acc, item) => acc + item.subtotal, 0);
  const esFiado = tipoPago === 'fiado';

  const venta = {
    id: generarId(),
    fecha: new Date().toISOString(),
    items: itemsConSubtotal,
    total,
    tipoPago: esFiado ? 'fiado' : 'inmediato',
    medioPago: esFiado ? null : medioPago || 'efectivo',
    clienteId: clienteId || null,
    pagada: !esFiado,
    nota: (nota || '').trim(),
  };

  await put(STORE, venta);

  // Descuenta el stock de los insumos según la receta de lo vendido.
  const [platos, combos] = await Promise.all([listarPlatos(), listarCombos()]);
  const consumo = calcularConsumoInsumos(itemsConSubtotal, platos, combos);
  for (const [insumoId, cantidad] of consumo.entries()) {
    if (cantidad <= 0) continue;
    await ajustarStock(insumoId, -cantidad, { tipo: 'venta', motivo: 'Venta' });
  }

  return venta;
}

export async function listarVentas({ desde, hasta } = {}) {
  const ventas = await getAll(STORE);
  const filtradas = ventas.filter((v) => {
    if (desde && new Date(v.fecha) < new Date(desde)) return false;
    if (hasta && new Date(v.fecha) > new Date(hasta)) return false;
    return true;
  });
  return filtradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function obtenerVenta(id) {
  return getById(STORE, id);
}

export async function listarVentasDeCliente(clienteId) {
  const ventas = await getAllByIndex(STORE, 'clienteId', clienteId);
  return ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export async function marcarVentaPagada(id) {
  const venta = await obtenerVenta(id);
  if (!venta) throw new Error('Venta no encontrada.');
  return put(STORE, { ...venta, pagada: true });
}

/** Deuda del cliente = total fiado sin pagar − pagos a cuenta registrados. */
export async function saldoFiado(clienteId) {
  const [ventas, pagado] = await Promise.all([
    listarVentasDeCliente(clienteId),
    totalPagado(clienteId),
  ]);
  const fiadoImpago = ventas
    .filter((v) => v.tipoPago === 'fiado' && !v.pagada)
    .reduce((acc, v) => acc + Number(v.total), 0);
  return Math.max(0, fiadoImpago - pagado);
}

/**
 * Resumen de todos los clientes de una sola pasada (deuda, última compra,
 * cuánto compró en total). Se hace así en vez de llamar saldoFiado() por
 * cliente para no disparar dos consultas por cada uno en la lista.
 * Devuelve un Map clienteId -> resumen.
 */
export async function resumenDeClientes() {
  const [ventas, pagos] = await Promise.all([getAll(STORE), listarTodosLosPagos()]);
  const mapa = new Map();

  const inicializar = (clienteId) => {
    if (!mapa.has(clienteId)) {
      mapa.set(clienteId, { deuda: 0, ultimaCompra: null, cantidadCompras: 0, totalComprado: 0 });
    }
    return mapa.get(clienteId);
  };

  ventas.forEach((venta) => {
    if (!venta.clienteId) return;
    const resumen = inicializar(venta.clienteId);
    resumen.cantidadCompras += 1;
    resumen.totalComprado += Number(venta.total);
    if (venta.tipoPago === 'fiado' && !venta.pagada) {
      resumen.deuda += Number(venta.total);
    }
    if (!resumen.ultimaCompra || new Date(venta.fecha) > new Date(resumen.ultimaCompra)) {
      resumen.ultimaCompra = venta.fecha;
    }
  });

  pagos.forEach((pago) => {
    const resumen = inicializar(pago.clienteId);
    resumen.deuda -= Number(pago.monto);
  });

  mapa.forEach((resumen) => {
    resumen.deuda = Math.max(0, resumen.deuda);
  });

  return mapa;
}

/** Totales de ventas de un período, para el resumen de Inicio. */
export async function totalesDeVentas({ desde, hasta } = {}) {
  const ventas = await getAll(STORE);
  const delPeriodo = ventas.filter((v) => estaEnRango(v.fecha, { desde, hasta }));

  return delPeriodo.reduce(
    (acc, venta) => {
      const total = Number(venta.total);
      acc.total += total;
      acc.cantidad += 1;
      if (venta.tipoPago === 'fiado' && !venta.pagada) acc.fiadoPendiente += total;
      else acc.cobrado += total;
      return acc;
    },
    { total: 0, cantidad: 0, cobrado: 0, fiadoPendiente: 0 }
  );
}
