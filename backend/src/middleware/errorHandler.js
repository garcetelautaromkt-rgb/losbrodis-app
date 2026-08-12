function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: err.errors?.map((e) => e.message) || [err.message],
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ error: 'La operación viola una relación existente entre registros.' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor.' });
}

module.exports = { notFoundHandler, errorHandler };
