const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampaniaMarketing = sequelize.define('CampaniaMarketing', {
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
  tipo: {
    type: DataTypes.ENUM('redes_sociales', 'email', 'whatsapp', 'promocion', 'evento', 'otro'),
    defaultValue: 'redes_sociales',
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'fecha_inicio',
  },
  fechaFin: {
    type: DataTypes.DATEONLY,
    field: 'fecha_fin',
  },
  presupuesto: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  alcanceEstimado: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'alcance_estimado',
  },
  clientesImpactados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'clientes_impactados',
  },
  ventasGeneradas: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'ventas_generadas',
    comment: 'Monto total de ventas atribuidas a la campaña',
  },
  estado: {
    type: DataTypes.ENUM('planificada', 'activa', 'finalizada', 'cancelada'),
    defaultValue: 'planificada',
  },
}, {
  tableName: 'campanias_marketing',
});

module.exports = CampaniaMarketing;
