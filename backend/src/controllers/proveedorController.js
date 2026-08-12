const { Proveedor } = require('../models');

async function listar(req, res) {
  const proveedores = await Proveedor.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    order: [['nombre', 'ASC']],
  });
  res.json(proveedores);
}

async function obtener(req, res) {
  const proveedor = await Proveedor.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
  res.json(proveedor);
}

async function crear(req, res) {
  const { nombre, contacto, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const proveedor = await Proveedor.create({
    emprendimientoId: req.user.emprendimientoId,
    nombre,
    contacto,
    telefono,
    email,
    direccion,
  });
  res.status(201).json(proveedor);
}

async function actualizar(req, res) {
  const proveedor = await Proveedor.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
  await proveedor.update(req.body);
  res.json(proveedor);
}

async function eliminar(req, res) {
  const proveedor = await Proveedor.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
  await proveedor.update({ activo: false });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
