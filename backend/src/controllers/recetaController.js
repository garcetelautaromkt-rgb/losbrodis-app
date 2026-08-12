const { sequelize, Receta, RecetaInsumo, Insumo } = require('../models');
const { calcularCostoReceta, calcularPrecioSugerido } = require('../utils/pricing');

async function listar(req, res) {
  const recetas = await Receta.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'insumos', include: [{ association: 'insumo' }] }],
    order: [['nombre', 'ASC']],
  });
  res.json(recetas);
}

async function obtener(req, res) {
  const receta = await Receta.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'insumos', include: [{ association: 'insumo' }] }],
  });
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada.' });
  res.json(receta);
}

// Recalcula costoProduccion, costoPorUnidad y precioSugerido de una receta
// a partir de sus insumos actuales y los persiste.
async function recalcularYGuardar(receta, transaction) {
  const recetaInsumos = await RecetaInsumo.findAll({ where: { recetaId: receta.id }, transaction });
  const insumos = await Insumo.findAll({
    where: { id: recetaInsumos.map((ri) => ri.insumoId) },
    transaction,
  });
  const insumosMap = new Map(insumos.map((i) => [String(i.id), i]));

  const { costoInsumos, costoProduccion, costoPorUnidad } = calcularCostoReceta({
    recetaInsumos,
    insumosMap,
    costoManoObra: receta.costoManoObra,
    costosAdicionales: receta.costosAdicionales,
    rendimiento: receta.rendimiento,
  });

  const { precioSugerido } = calcularPrecioSugerido({
    costoPorUnidad,
    margenGanancia: receta.margenGanancia,
    tipoMargen: receta.tipoMargen,
  });

  await receta.update({ costoProduccion, costoPorUnidad, precioSugerido }, { transaction });
  return { costoInsumos, costoProduccion, costoPorUnidad, precioSugerido };
}

// POST /api/recetas
// body: { nombre, descripcion, rendimiento, costoManoObra, costosAdicionales,
//         margenGanancia, tipoMargen, insumos: [{ insumoId, cantidad }] }
async function crear(req, res) {
  const {
    nombre, descripcion, rendimiento, costoManoObra, costosAdicionales,
    margenGanancia, tipoMargen, insumos,
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  const receta = await sequelize.transaction(async (t) => {
    const nuevaReceta = await Receta.create(
      {
        emprendimientoId: req.user.emprendimientoId,
        nombre,
        descripcion,
        rendimiento: rendimiento || 1,
        costoManoObra: costoManoObra || 0,
        costosAdicionales: costosAdicionales || 0,
        margenGanancia: margenGanancia ?? 40,
        tipoMargen: tipoMargen || 'sobre_costo',
      },
      { transaction: t }
    );

    if (Array.isArray(insumos)) {
      for (const it of insumos) {
        await RecetaInsumo.create(
          { recetaId: nuevaReceta.id, insumoId: it.insumoId, cantidad: it.cantidad },
          { transaction: t }
        );
      }
    }

    await recalcularYGuardar(nuevaReceta, t);
    return nuevaReceta;
  });

  const recetaCompleta = await Receta.findByPk(receta.id, {
    include: [{ association: 'insumos', include: [{ association: 'insumo' }] }],
  });
  res.status(201).json(recetaCompleta);
}

// PUT /api/recetas/:id
// Permite actualizar datos generales y reemplazar la lista de insumos.
async function actualizar(req, res) {
  const receta = await Receta.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada.' });

  const {
    nombre, descripcion, rendimiento, costoManoObra, costosAdicionales,
    margenGanancia, tipoMargen, insumos, activo,
  } = req.body;

  await sequelize.transaction(async (t) => {
    await receta.update(
      { nombre, descripcion, rendimiento, costoManoObra, costosAdicionales, margenGanancia, tipoMargen, activo },
      { transaction: t }
    );

    if (Array.isArray(insumos)) {
      await RecetaInsumo.destroy({ where: { recetaId: receta.id }, transaction: t });
      for (const it of insumos) {
        await RecetaInsumo.create(
          { recetaId: receta.id, insumoId: it.insumoId, cantidad: it.cantidad },
          { transaction: t }
        );
      }
    }

    await recalcularYGuardar(receta, t);
  });

  const recetaActualizada = await Receta.findByPk(receta.id, {
    include: [{ association: 'insumos', include: [{ association: 'insumo' }] }],
  });
  res.json(recetaActualizada);
}

// GET /api/recetas/:id/costo
// Devuelve el detalle de costo y precio sugerido sin persistir cambios,
// útil para simular escenarios desde el front (ej. cambiar el margen).
async function simularCosto(req, res) {
  const receta = await Receta.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'insumos', include: [{ association: 'insumo' }] }],
  });
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada.' });

  const margenGanancia = req.query.margen !== undefined ? Number(req.query.margen) : receta.margenGanancia;
  const tipoMargen = req.query.tipoMargen || receta.tipoMargen;

  const insumosMap = new Map(receta.insumos.map((ri) => [String(ri.insumoId), ri.insumo]));
  const { costoInsumos, costoProduccion, costoPorUnidad } = calcularCostoReceta({
    recetaInsumos: receta.insumos,
    insumosMap,
    costoManoObra: receta.costoManoObra,
    costosAdicionales: receta.costosAdicionales,
    rendimiento: receta.rendimiento,
  });
  const { precioSugerido, gananciaUnitaria, margenRealSobrePrecio } = calcularPrecioSugerido({
    costoPorUnidad,
    margenGanancia,
    tipoMargen,
  });

  res.json({
    recetaId: receta.id,
    rendimiento: receta.rendimiento,
    costoInsumos,
    costoManoObra: Number(receta.costoManoObra),
    costosAdicionales: Number(receta.costosAdicionales),
    costoProduccion,
    costoPorUnidad,
    margenGanancia,
    tipoMargen,
    precioSugerido,
    gananciaUnitaria,
    margenRealSobrePrecio,
  });
}

async function eliminar(req, res) {
  const receta = await Receta.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada.' });
  await receta.update({ activo: false });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, simularCosto, eliminar, recalcularYGuardar };
