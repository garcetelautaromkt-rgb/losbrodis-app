const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompraItem = sequelize.define('CompraItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  compraId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'compra_id',
  },
  insumoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'insumo_id',
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  costoUnitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'costo_unitario',
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'compra_items',
});

module.exports = CompraItem;
