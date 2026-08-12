const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Compra = sequelize.define('Compra', {
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
  proveedorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'proveedor_id',
  },
  numeroComprobante: {
    type: DataTypes.STRING(50),
    field: 'numero_comprobante',
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'recibida', 'cancelada'),
    defaultValue: 'pendiente',
  },
  notas: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'compras',
});

module.exports = Compra;
