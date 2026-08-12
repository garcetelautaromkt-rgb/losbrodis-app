const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Emprendimiento = sequelize.define('Emprendimiento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  rubro: {
    type: DataTypes.STRING(100),
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  moneda: {
    type: DataTypes.STRING(10),
    defaultValue: 'ARS',
  },
  logoUrl: {
    type: DataTypes.STRING(255),
  },
  direccion: {
    type: DataTypes.STRING(255),
  },
  telefono: {
    type: DataTypes.STRING(50),
  },
  email: {
    type: DataTypes.STRING(150),
    validate: { isEmail: true },
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'emprendimientos',
});

module.exports = Emprendimiento;
