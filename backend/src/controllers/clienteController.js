const { Cliente } = require('../models');

async function listar(req, res) {
  const clientes = await Cliente.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    order: [['nombre', 'ASC']],
  });
  res.json(clientes);
}

async function obtener(req, res) {
  const cliente = await Cliente.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'ventas', limit: 20, order: [['fecha', 'DESC']] }],
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  res.json(cliente);
}

async function crear(req, res) {
  const { nombre, tipo, telefono, email, direccion, origen, notas } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const cliente = await Cliente.create({
    emprendimientoId: req.user.emprendimientoId,
    nombre, tipo, telefono, email, direccion, origen, notas,
  });
  res.status(201).json(cliente);
}

async function actualizar(req, res) {
  const cliente = await Cliente.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  await cliente.update(req.body);
  res.json(cliente);
}

async function eliminar(req, res) {
  const cliente = await Cliente.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  await cliente.update({ activo: false });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
