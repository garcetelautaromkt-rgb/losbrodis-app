const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecetaInsumo = sequelize.define('RecetaInsumo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  recetaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'receta_id',
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
}, {
  tableName: 'receta_insumos',
});

module.exports = RecetaInsumo;
