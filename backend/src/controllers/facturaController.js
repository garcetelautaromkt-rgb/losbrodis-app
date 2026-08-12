const { Op } = require('sequelize');
const { Factura } = require('../models');

async function listar(req, res) {
  const { tipo, estado } = req.query;
  const where = { emprendimientoId: req.user.emprendimientoId };
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;

  const facturas = await Factura.findAll({ where, order: [['fechaEmision', 'DESC']] });
  res.json(facturas);
}

async function obtener(req, res) {
  const factura = await Factura.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada.' });
  res.json(factura);
}

// POST /api/facturas
// Carga manual de una factura (de venta, compra o gasto), incluyendo la URL
// de un comprobante escaneado/PDF ya subido a un storage externo.
async function crear(req, res) {
  const {
    ventaId, compraId, tipo, numero, emisorReceptor,
    fechaEmision, fechaVencimiento, montoTotal, archivoUrl, notas,
  } = req.body;

  if (!tipo || montoTotal === undefined) {
    return res.status(400).json({ error: 'tipo y montoTotal son obligatorios.' });
  }

  const factura = await Factura.create({
    emprendimientoId: req.user.emprendimientoId,
    ventaId: ventaId || null,
    compraId: compraId || null,
    tipo, numero, emisorReceptor,
    fechaEmision: fechaEmision || new Date(),
    fechaVencimiento,
    montoTotal,
    archivoUrl,
    notas,
  });
  res.status(201).json(factura);
}

async function actualizar(req, res) {
  const factura = await Factura.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada.' });
  await factura.update(req.body);
  res.json(factura);
}

// GET /api/facturas/analisis
// Resumen para el módulo de administración: totales por tipo/estado y
// facturas próximas a vencer (para alertar de pagos pendientes).
async function analisis(req, res) {
  const facturas = await Factura.findAll({ where: { emprendimientoId: req.user.emprendimientoId } });

  const resumen = {
    totalVentas: 0,
    totalCompras: 0,
    totalGastos: 0,
    pendientesPago: 0,
    montoPendiente: 0,
    proximasAVencer: [],
  };

  const hoy = new Date();
  const enSieteDias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const f of facturas) {
    const monto = Number(f.montoTotal);
    if (f.tipo === 'venta') resumen.totalVentas += monto;
    if (f.tipo === 'compra') resumen.totalCompras += monto;
    if (f.tipo === 'gasto') resumen.totalGastos += monto;

    if (f.estado === 'pendiente') {
      resumen.pendientesPago += 1;
      resumen.montoPendiente += monto;
      if (f.fechaVencimiento && new Date(f.fechaVencimiento) <= enSieteDias) {
        resumen.proximasAVencer.push(f);
      }
    }
  }

  res.json(resumen);
}

async function eliminar(req, res) {
  const factura = await Factura.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada.' });
  await factura.update({ estado: 'anulada' });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, analisis, eliminar };
