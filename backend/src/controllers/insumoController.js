const { Op } = require('sequelize');
const { Insumo } = require('../models');

async function listar(req, res) {
  const { bajoStock } = req.query;
  const where = { emprendimientoId: req.user.emprendimientoId };

  const insumos = await Insumo.findAll({
    where,
    include: [{ association: 'proveedor', attributes: ['id', 'nombre'] }],
    order: [['nombre', 'ASC']],
  });

  const resultado = bajoStock === 'true'
    ? insumos.filter((i) => Number(i.stockActual) <= Number(i.stockMinimo))
    : insumos;

  res.json(resultado);
}

async function obtener(req, res) {
  const insumo = await Insumo.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'proveedor', attributes: ['id', 'nombre'] }],
  });
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado.' });
  res.json(insumo);
}

async function crear(req, res) {
  const { nombre, unidadMedida, stockActual, stockMinimo, costoUnitario, proveedorId } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  const insumo = await Insumo.create({
    emprendimientoId: req.user.emprendimientoId,
    nombre,
    unidadMedida,
    stockActual: stockActual || 0,
    stockMinimo: stockMinimo || 0,
    costoUnitario: costoUnitario || 0,
    proveedorId: proveedorId || null,
  });
  res.status(201).json(insumo);
}

async function actualizar(req, res) {
  const insumo = await Insumo.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado.' });
  await insumo.update(req.body);
  res.json(insumo);
}

async function ajustarStock(req, res) {
  const insumo = await Insumo.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado.' });

  const { cantidad, motivo } = req.body;
  if (cantidad === undefined) return res.status(400).json({ error: 'Debe indicar "cantidad" (positiva o negativa).' });

  const nuevoStock = Number(insumo.stockActual) + Number(cantidad);
  if (nuevoStock < 0) return res.status(400).json({ error: 'El ajuste dejaría stock negativo.' });

  await insumo.update({ stockActual: nuevoStock });
  res.json({ insumo, motivo: motivo || null });
}

async function eliminar(req, res) {
  const insumo = await Insumo.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado.' });
  await insumo.update({ activo: false });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, ajustarStock, eliminar };
