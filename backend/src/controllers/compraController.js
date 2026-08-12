const { sequelize, Compra, CompraItem, Insumo, MovimientoCaja } = require('../models');
const { round2 } = require('../utils/pricing');

async function listar(req, res) {
  const compras = await Compra.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    include: [
      { association: 'proveedor', attributes: ['id', 'nombre'] },
      { association: 'items', include: [{ association: 'insumo', attributes: ['id', 'nombre', 'unidadMedida'] }] },
    ],
    order: [['fecha', 'DESC']],
  });
  res.json(compras);
}

async function obtener(req, res) {
  const compra = await Compra.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [
      { association: 'proveedor' },
      { association: 'items', include: [{ association: 'insumo' }] },
    ],
  });
  if (!compra) return res.status(404).json({ error: 'Compra no encontrada.' });
  res.json(compra);
}

// POST /api/compras
// body: { proveedorId, fecha, numeroComprobante, notas, registrarEnCaja,
//         items: [{ insumoId, cantidad, costoUnitario }] }
// Registra la compra, actualiza stock y costo unitario de cada insumo,
// y opcionalmente genera un egreso en el módulo de caja.
async function crear(req, res) {
  const { proveedorId, fecha, numeroComprobante, notas, items, registrarEnCaja = true } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La compra debe tener al menos un ítem.' });
  }

  const resultado = await sequelize.transaction(async (t) => {
    const total = round2(items.reduce((acc, it) => acc + Number(it.cantidad) * Number(it.costoUnitario), 0));

    const compra = await Compra.create(
      {
        emprendimientoId: req.user.emprendimientoId,
        proveedorId: proveedorId || null,
        fecha: fecha || new Date(),
        numeroComprobante,
        notas,
        total,
        estado: 'recibida',
      },
      { transaction: t }
    );

    for (const it of items) {
      const insumo = await Insumo.findOne({
        where: { id: it.insumoId, emprendimientoId: req.user.emprendimientoId },
        transaction: t,
      });
      if (!insumo) throw badRequest(`Insumo ${it.insumoId} no existe en este emprendimiento.`);

      const subtotal = round2(Number(it.cantidad) * Number(it.costoUnitario));
      await CompraItem.create(
        {
          compraId: compra.id,
          insumoId: insumo.id,
          cantidad: it.cantidad,
          costoUnitario: it.costoUnitario,
          subtotal,
        },
        { transaction: t }
      );

      // Actualiza stock y recalcula costo unitario por promedio ponderado.
      const stockAnterior = Number(insumo.stockActual);
      const stockNuevo = stockAnterior + Number(it.cantidad);
      const costoPonderado =
        stockNuevo > 0
          ? round2((stockAnterior * Number(insumo.costoUnitario) + Number(it.cantidad) * Number(it.costoUnitario)) / stockNuevo)
          : Number(it.costoUnitario);

      await insumo.update(
        { stockActual: stockNuevo, costoUnitario: costoPonderado },
        { transaction: t }
      );
    }

    if (registrarEnCaja) {
      await MovimientoCaja.create(
        {
          emprendimientoId: req.user.emprendimientoId,
          tipo: 'egreso',
          categoria: 'Compra de insumos',
          monto: total,
          fecha: fecha || new Date(),
          descripcion: `Compra ${numeroComprobante || compra.id}`,
          compraId: compra.id,
        },
        { transaction: t }
      );
    }

    return compra;
  });

  const compraCompleta = await Compra.findByPk(resultado.id, {
    include: [{ association: 'items', include: [{ association: 'insumo' }] }, { association: 'proveedor' }],
  });
  res.status(201).json(compraCompleta);
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

module.exports = { listar, obtener, crear };
