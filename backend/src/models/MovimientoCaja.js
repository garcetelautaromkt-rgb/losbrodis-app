const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoCaja = sequelize.define('MovimientoCaja', {
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
  tipo: {
    type: DataTypes.ENUM('ingreso', 'egreso'),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Ventas, Compra de insumos, Sueldos, Alquiler, Marketing, Logística, Otro...',
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  medioPago: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'tarjeta', 'billetera_virtual', 'otro'),
    defaultValue: 'efectivo',
    field: 'medio_pago',
  },
  descripcion: {
    type: DataTypes.STRING(255),
  },
  ventaId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'venta_id',
  },
  compraId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'compra_id',
  },
}, {
  tableName: 'movimientos_caja',
});

module.exports = MovimientoCaja;
