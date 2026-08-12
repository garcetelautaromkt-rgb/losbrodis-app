const { CampaniaMarketing } = require('../models');

async function listar(req, res) {
  const campanias = await CampaniaMarketing.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    order: [['fechaInicio', 'DESC']],
  });
  res.json(campanias);
}

async function obtener(req, res) {
  const campania = await CampaniaMarketing.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!campania) return res.status(404).json({ error: 'Campaña no encontrada.' });
  res.json(campania);
}

async function crear(req, res) {
  const {
    nombre, tipo, descripcion, fechaInicio, fechaFin,
    presupuesto, alcanceEstimado, clientesImpactados, estado,
  } = req.body;

  if (!nombre || !fechaInicio) {
    return res.status(400).json({ error: 'nombre y fechaInicio son obligatorios.' });
  }

  const campania = await CampaniaMarketing.create({
    emprendimientoId: req.user.emprendimientoId,
    nombre, tipo, descripcion, fechaInicio, fechaFin,
    presupuesto: presupuesto || 0,
    alcanceEstimado: alcanceEstimado || 0,
    clientesImpactados: clientesImpactados || 0,
    estado: estado || 'planificada',
  });
  res.status(201).json(campania);
}

async function actualizar(req, res) {
  const campania = await CampaniaMarketing.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!campania) return res.status(404).json({ error: 'Campaña no encontrada.' });
  await campania.update(req.body);
  res.json(campania);
}

async function eliminar(req, res) {
  const campania = await CampaniaMarketing.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!campania) return res.status(404).json({ error: 'Campaña no encontrada.' });
  await campania.update({ estado: 'cancelada' });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
