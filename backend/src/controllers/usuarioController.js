const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

async function listar(req, res) {
  const usuarios = await Usuario.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    attributes: { exclude: ['passwordHash'] },
    order: [['nombre', 'ASC']],
  });
  res.json(usuarios);
}

async function crear(req, res) {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'nombre, email y password son obligatorios.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    emprendimientoId: req.user.emprendimientoId,
    nombre,
    email,
    passwordHash,
    rol: rol || 'vendedor',
  });
  const { passwordHash: _omit, ...safe } = usuario.toJSON();
  res.status(201).json(safe);
}

async function actualizar(req, res) {
  const usuario = await Usuario.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const { nombre, rol, activo, password } = req.body;
  const cambios = { nombre, rol, activo };
  if (password) cambios.passwordHash = await bcrypt.hash(password, 10);

  await usuario.update(cambios);
  const { passwordHash: _omit, ...safe } = usuario.toJSON();
  res.json(safe);
}

async function eliminar(req, res) {
  const usuario = await Usuario.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  await usuario.update({ activo: false });
  res.status(204).send();
}

module.exports = { listar, crear, actualizar, eliminar };
