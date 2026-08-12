const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VentaItem = sequelize.define('VentaItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ventaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'venta_id',
  },
  productoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'producto_id',
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 1,
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'precio_unitario',
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'venta_items',
});

module.exports = VentaItem;
