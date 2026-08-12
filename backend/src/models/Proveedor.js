const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
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
  contacto: {
    type: DataTypes.STRING(150),
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
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'proveedores',
});

module.exports = Proveedor;
