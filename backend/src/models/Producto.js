const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
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
  recetaId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'receta_id',
    comment: 'Receta que define el costo de producción del producto (opcional)',
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING(100),
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  imagenUrl: {
    type: DataTypes.STRING(255),
    field: 'imagen_url',
  },
  costoUnitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'costo_unitario',
  },
  margenGanancia: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 40,
    field: 'margen_ganancia',
  },
  precioVenta: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'precio_venta',
  },
  controlaStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'controla_stock',
  },
  stockActual: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'stock_actual',
  },
  stockMinimo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'stock_minimo',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'productos',
});

module.exports = Producto;
