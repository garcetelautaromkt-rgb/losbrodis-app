const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('Factura', {
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
  tipo: {
    type: DataTypes.ENUM('venta', 'compra', 'gasto'),
    allowNull: false,
  },
  numero: {
    type: DataTypes.STRING(50),
  },
  emisorReceptor: {
    type: DataTypes.STRING(150),
    field: 'emisor_receptor',
    comment: 'Nombre del cliente (factura de venta) o proveedor (factura de compra/gasto)',
  },
  fechaEmision: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_emision',
  },
  fechaVencimiento: {
    type: DataTypes.DATEONLY,
    field: 'fecha_vencimiento',
  },
  montoTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'monto_total',
  },
  archivoUrl: {
    type: DataTypes.STRING(255),
    field: 'archivo_url',
    comment: 'URL del comprobante escaneado/PDF cargado',
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagada', 'vencida', 'anulada'),
    defaultValue: 'pendiente',
  },
  notas: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'facturas',
});

module.exports = Factura;
