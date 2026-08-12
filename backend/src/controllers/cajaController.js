const { Op } = require('sequelize');
const { MovimientoCaja } = require('../models');

async function listar(req, res) {
  const { desde, hasta, tipo } = req.query;
  const where = { emprendimientoId: req.user.emprendimientoId };
  if (tipo) where.tipo = tipo;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = desde;
    if (hasta) where.fecha[Op.lte] = hasta;
  }

  const movimientos = await MovimientoCaja.findAll({ where, order: [['fecha', 'DESC']] });
  res.json(movimientos);
}

// POST /api/caja/movimientos
// Movimientos manuales (sueldos, alquiler, retiros, aportes, etc). Los
// movimientos generados por ventas/compras se crean automáticamente.
async function crear(req, res) {
  const { tipo, categoria, monto, fecha, medioPago, descripcion } = req.body;
  if (!tipo || !categoria || monto === undefined) {
    return res.status(400).json({ error: 'tipo, categoria y monto son obligatorios.' });
  }
  const movimiento = await MovimientoCaja.create({
    emprendimientoId: req.user.emprendimientoId,
    tipo, categoria, monto,
    fecha: fecha || new Date(),
    medioPago: medioPago || 'efectivo',
    descripcion,
  });
  res.status(201).json(movimiento);
}

// GET /api/caja/balance?desde=&hasta=
// Balance rápido: total de ingresos, egresos, resultado neto y desglose
// por categoría, para el módulo de Administración y Contabilidad.
async function balance(req, res) {
  const { desde, hasta } = req.query;
  const where = { emprendimientoId: req.user.emprendimientoId };
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = desde;
    if (hasta) where.fecha[Op.lte] = hasta;
  }

  const movimientos = await MovimientoCaja.findAll({ where });

  let ingresos = 0;
  let egresos = 0;
  const porCategoria = {};

  for (const m of movimientos) {
    const monto = Number(m.monto);
    if (m.tipo === 'ingreso') ingresos += monto;
    else egresos += monto;

    const clave = `${m.tipo}:${m.categoria}`;
    porCategoria[clave] = (porCategoria[clave] || 0) + monto;
  }

  res.json({
    periodo: { desde: desde || null, hasta: hasta || null },
    ingresos: round2(ingresos),
    egresos: round2(egresos),
    resultadoNeto: round2(ingresos - egresos),
    porCategoria,
  });
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { listar, crear, balance };
