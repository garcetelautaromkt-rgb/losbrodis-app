const { sequelize, Venta, VentaItem, Producto, MovimientoCaja } = require('../models');
const { round2 } = require('../utils/pricing');

async function listar(req, res) {
  const { desde, hasta } = req.query;
  const where = { emprendimientoId: req.user.emprendimientoId };
  if (desde || hasta) {
    const { Op } = require('sequelize');
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = new Date(desde);
    if (hasta) where.fecha[Op.lte] = new Date(hasta);
  }

  const ventas = await Venta.findAll({
    where,
    include: [
      { association: 'cliente', attributes: ['id', 'nombre'] },
      { association: 'items', include: [{ association: 'producto', attributes: ['id', 'nombre'] }] },
    ],
    order: [['fecha', 'DESC']],
  });
  res.json(ventas);
}

async function obtener(req, res) {
  const venta = await Venta.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [
      { association: 'cliente' },
      { association: 'vendedor', attributes: ['id', 'nombre'] },
      { association: 'items', include: [{ association: 'producto' }] },
      { association: 'envio' },
    ],
  });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });
  res.json(venta);
}

// POST /api/ventas
// body: { clienteId, canal, medioPago, items: [{ productoId, cantidad }], registrarEnCaja }
// Descuenta stock de los productos vendidos (si controlan stock) y registra
// automáticamente el ingreso correspondiente en el módulo de caja.
async function crear(req, res) {
  const { clienteId, canal, medioPago, items, registrarEnCaja = true } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe tener al menos un ítem.' });
  }

  const resultado = await sequelize.transaction(async (t) => {
    let total = 0;
    const detalles = [];

    for (const it of items) {
      const producto = await Producto.findOne({
        where: { id: it.productoId, emprendimientoId: req.user.emprendimientoId },
        transaction: t,
      });
      if (!producto) throw badRequest(`Producto ${it.productoId} no existe en este emprendimiento.`);

      const cantidad = Number(it.cantidad);
      if (producto.controlaStock && Number(producto.stockActual) < cantidad) {
        throw badRequest(`Stock insuficiente de "${producto.nombre}" (disponible: ${producto.stockActual}).`);
      }

      const precioUnitario = it.precioUnitario !== undefined ? Number(it.precioUnitario) : Number(producto.precioVenta);
      const subtotal = round2(precioUnitario * cantidad);
      total += subtotal;
      detalles.push({ producto, cantidad, precioUnitario, subtotal });
    }
    total = round2(total);

    const venta = await Venta.create(
      {
        emprendimientoId: req.user.emprendimientoId,
        clienteId: clienteId || null,
        usuarioId: req.user.id,
        canal: canal || 'local',
        medioPago: medioPago || 'efectivo',
        total,
        estado: 'completada',
      },
      { transaction: t }
    );

    for (const d of detalles) {
      await VentaItem.create(
        {
          ventaId: venta.id,
          productoId: d.producto.id,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal,
        },
        { transaction: t }
      );

      if (d.producto.controlaStock) {
        await d.producto.update(
          { stockActual: round2(Number(d.producto.stockActual) - d.cantidad) },
          { transaction: t }
        );
      }
    }

    if (registrarEnCaja) {
      await MovimientoCaja.create(
        {
          emprendimientoId: req.user.emprendimientoId,
          tipo: 'ingreso',
          categoria: 'Ventas',
          monto: total,
          fecha: new Date(),
          descripcion: `Venta ${venta.id}`,
          ventaId: venta.id,
        },
        { transaction: t }
      );
    }

    return venta;
  });

  const ventaCompleta = await Venta.findByPk(resultado.id, {
    include: [{ association: 'items', include: [{ association: 'producto' }] }, { association: 'cliente' }],
  });
  res.status(201).json(ventaCompleta);
}

async function cancelar(req, res) {
  const venta = await Venta.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'items', include: [{ association: 'producto' }] }],
  });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });
  if (venta.estado === 'cancelada') return res.status(400).json({ error: 'La venta ya está cancelada.' });

  await sequelize.transaction(async (t) => {
    for (const item of venta.items) {
      if (item.producto?.controlaStock) {
        await item.producto.update(
          { stockActual: round2(Number(item.producto.stockActual) + Number(item.cantidad)) },
          { transaction: t }
        );
      }
    }
    await venta.update({ estado: 'cancelada' }, { transaction: t });
    await MovimientoCaja.create(
      {
        emprendimientoId: req.user.emprendimientoId,
        tipo: 'egreso',
        categoria: 'Anulación de venta',
        monto: venta.total,
        fecha: new Date(),
        descripcion: `Cancelación de venta ${venta.id}`,
        ventaId: venta.id,
      },
      { transaction: t }
    );
  });

  res.json({ mensaje: 'Venta cancelada y stock repuesto.' });
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

module.exports = { listar, obtener, crear, cancelar };
