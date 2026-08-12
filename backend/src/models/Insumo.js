const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Insumo = sequelize.define('Insumo', {
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
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  unidadMedida: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'unidad',
    field: 'unidad_medida',
  },
  stockActual: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 0,
    field: 'stock_actual',
  },
  stockMinimo: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 0,
    field: 'stock_minimo',
  },
  costoUnitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'costo_unitario',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'insumos',
});

module.exports = Insumo;
