const { Emprendimiento } = require('../models');

// GET /api/emprendimientos/actual
async function obtenerActual(req, res) {
  const emprendimiento = await Emprendimiento.findByPk(req.user.emprendimientoId);
  if (!emprendimiento) return res.status(404).json({ error: 'Emprendimiento no encontrado.' });
  res.json(emprendimiento);
}

// PUT /api/emprendimientos/actual
async function actualizarActual(req, res) {
  const emprendimiento = await Emprendimiento.findByPk(req.user.emprendimientoId);
  if (!emprendimiento) return res.status(404).json({ error: 'Emprendimiento no encontrado.' });

  const { nombre, rubro, descripcion, moneda, logoUrl, direccion, telefono, email, activo } = req.body;
  await emprendimiento.update({ nombre, rubro, descripcion, moneda, logoUrl, direccion, telefono, email, activo });
  res.json(emprendimiento);
}

module.exports = { obtenerActual, actualizarActual };
