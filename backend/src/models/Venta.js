const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venta = sequelize.define('Venta', {
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
  clienteId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cliente_id',
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'usuario_id',
    comment: 'Vendedor que registró la venta',
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  canal: {
    type: DataTypes.ENUM('local', 'online', 'telefono', 'redes_sociales'),
    defaultValue: 'local',
  },
  medioPago: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'tarjeta', 'billetera_virtual', 'otro'),
    defaultValue: 'efectivo',
    field: 'medio_pago',
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'completada', 'cancelada'),
    defaultValue: 'completada',
  },
}, {
  tableName: 'ventas',
});

module.exports = Venta;
