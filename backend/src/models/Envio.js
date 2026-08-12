const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Envio = sequelize.define('Envio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  emprendimientoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'emprendimiento_id',
  },
  ventaId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'venta_id',
  },
  clienteId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cliente_id',
  },
  direccionEntrega: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'direccion_entrega',
  },
  transportista: {
    type: DataTypes.STRING(150),
  },
  costoEnvio: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'costo_envio',
  },
  fechaProgramada: {
    type: DataTypes.DATE,
    field: 'fecha_programada',
  },
  fechaEntrega: {
    type: DataTypes.DATE,
    field: 'fecha_entrega',
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado'),
    defaultValue: 'pendiente',
  },
  notas: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'envios',
});

module.exports = Envio;
