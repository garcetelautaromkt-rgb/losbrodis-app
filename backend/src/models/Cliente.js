const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
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
    type: DataTypes.ENUM('individual', 'empresa'),
    defaultValue: 'individual',
  },
  telefono: {
    type: DataTypes.STRING(50),
  },
  email: {
    type: DataTypes.STRING(150),
  },
  direccion: {
    type: DataTypes.STRING(255),
  },
  origen: {
    type: DataTypes.STRING(100),
    comment: 'Canal por el que llegó: Instagram, referido, web, etc. (marketing)',
  },
  notas: {
    type: DataTypes.TEXT,
  },
  fechaAlta: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    field: 'fecha_alta',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'clientes',
});

module.exports = Cliente;
