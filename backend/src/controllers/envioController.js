const { Envio } = require('../models');

async function listar(req, res) {
  const { estado } = req.query;
  const where = { emprendimientoId: req.user.emprendimientoId };
  if (estado) where.estado = estado;

  const envios = await Envio.findAll({
    where,
    include: [
      { association: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
      { association: 'venta', attributes: ['id', 'total'] },
    ],
    order: [['fechaProgramada', 'ASC']],
  });
  res.json(envios);
}

async function obtener(req, res) {
  const envio = await Envio.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'cliente' }, { association: 'venta' }],
  });
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado.' });
  res.json(envio);
}

async function crear(req, res) {
  const {
    ventaId, clienteId, direccionEntrega, transportista,
    costoEnvio, fechaProgramada, notas,
  } = req.body;

  if (!direccionEntrega) return res.status(400).json({ error: 'La dirección de entrega es obligatoria.' });

  const envio = await Envio.create({
    emprendimientoId: req.user.emprendimientoId,
    ventaId: ventaId || null,
    clienteId: clienteId || null,
    direccionEntrega,
    transportista,
    costoEnvio: costoEnvio || 0,
    fechaProgramada,
    notas,
  });
  res.status(201).json(envio);
}

// PATCH /api/envios/:id/estado
async function cambiarEstado(req, res) {
  const envio = await Envio.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado.' });

  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Use uno de: ${estadosValidos.join(', ')}` });
  }

  const cambios = { estado };
  if (estado === 'entregado') cambios.fechaEntrega = new Date();

  await envio.update(cambios);
  res.json(envio);
}

async function actualizar(req, res) {
  const envio = await Envio.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado.' });
  await envio.update(req.body);
  res.json(envio);
}

module.exports = { listar, obtener, crear, cambiarEstado, actualizar };
