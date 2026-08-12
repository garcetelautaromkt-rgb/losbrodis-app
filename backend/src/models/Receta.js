const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receta = sequelize.define('Receta', {
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
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  rendimiento: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 1,
    comment: 'Cantidad de unidades/porciones que produce la receta',
  },
  costoManoObra: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'costo_mano_obra',
  },
  costosAdicionales: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'costos_adicionales',
    comment: 'Empaque, servicios, etc.',
  },
  margenGanancia: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 40,
    field: 'margen_ganancia',
    comment: 'Porcentaje de ganancia deseado sobre el costo',
  },
  tipoMargen: {
    type: DataTypes.ENUM('sobre_costo', 'sobre_precio'),
    defaultValue: 'sobre_costo',
    field: 'tipo_margen',
    comment: 'sobre_costo: precio = costo * (1+margen). sobre_precio: precio = costo / (1-margen)',
  },
  costoProduccion: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'costo_produccion',
    comment: 'Costo total calculado (insumos + mano de obra + adicionales)',
  },
  costoPorUnidad: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'costo_por_unidad',
  },
  precioSugerido: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'precio_sugerido',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'recetas',
});

module.exports = Receta;
