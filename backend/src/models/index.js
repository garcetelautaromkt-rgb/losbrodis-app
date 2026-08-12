const sequelize = require('../config/database');

const Emprendimiento = require('./Emprendimiento');
const Usuario = require('./Usuario');
const Proveedor = require('./Proveedor');
const Insumo = require('./Insumo');
const Compra = require('./Compra');
const CompraItem = require('./CompraItem');
const Receta = require('./Receta');
const RecetaInsumo = require('./RecetaInsumo');
const Producto = require('./Producto');
const Cliente = require('./Cliente');
const Venta = require('./Venta');
const VentaItem = require('./VentaItem');
const Factura = require('./Factura');
const MovimientoCaja = require('./MovimientoCaja');
const CampaniaMarketing = require('./CampaniaMarketing');
const Envio = require('./Envio');

// ---------------------------------------------------------------------------
// Un Emprendimiento es el tenant raíz: todo el resto de las entidades le
// pertenece. Se define la cascada de borrado a nivel de aplicación (no ON
// DELETE CASCADE en la DB) para mantener el control desde los controladores.
// ---------------------------------------------------------------------------

Emprendimiento.hasMany(Usuario, { foreignKey: 'emprendimientoId', as: 'usuarios' });
Usuario.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });

Emprendimiento.hasMany(Proveedor, { foreignKey: 'emprendimientoId', as: 'proveedores' });
Proveedor.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });

Emprendimiento.hasMany(Insumo, { foreignKey: 'emprendimientoId', as: 'insumos' });
Insumo.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Proveedor.hasMany(Insumo, { foreignKey: 'proveedorId', as: 'insumos' });
Insumo.belongsTo(Proveedor, { foreignKey: 'proveedorId', as: 'proveedor' });

// Compras
Emprendimiento.hasMany(Compra, { foreignKey: 'emprendimientoId', as: 'compras' });
Compra.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Proveedor.hasMany(Compra, { foreignKey: 'proveedorId', as: 'compras' });
Compra.belongsTo(Proveedor, { foreignKey: 'proveedorId', as: 'proveedor' });

Compra.hasMany(CompraItem, { foreignKey: 'compraId', as: 'items', onDelete: 'CASCADE' });
CompraItem.belongsTo(Compra, { foreignKey: 'compraId', as: 'compra' });
Insumo.hasMany(CompraItem, { foreignKey: 'insumoId', as: 'comprasDetalle' });
CompraItem.belongsTo(Insumo, { foreignKey: 'insumoId', as: 'insumo' });

// Recetas y costos
Emprendimiento.hasMany(Receta, { foreignKey: 'emprendimientoId', as: 'recetas' });
Receta.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });

Receta.hasMany(RecetaInsumo, { foreignKey: 'recetaId', as: 'insumos', onDelete: 'CASCADE' });
RecetaInsumo.belongsTo(Receta, { foreignKey: 'recetaId', as: 'receta' });
Insumo.hasMany(RecetaInsumo, { foreignKey: 'insumoId', as: 'usosEnRecetas' });
RecetaInsumo.belongsTo(Insumo, { foreignKey: 'insumoId', as: 'insumo' });

// Productos
Emprendimiento.hasMany(Producto, { foreignKey: 'emprendimientoId', as: 'productos' });
Producto.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Receta.hasMany(Producto, { foreignKey: 'recetaId', as: 'productos' });
Producto.belongsTo(Receta, { foreignKey: 'recetaId', as: 'receta' });

// Clientes
Emprendimiento.hasMany(Cliente, { foreignKey: 'emprendimientoId', as: 'clientes' });
Cliente.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });

// Ventas
Emprendimiento.hasMany(Venta, { foreignKey: 'emprendimientoId', as: 'ventas' });
Venta.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Cliente.hasMany(Venta, { foreignKey: 'clienteId', as: 'ventas' });
Venta.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
Usuario.hasMany(Venta, { foreignKey: 'usuarioId', as: 'ventas' });
Venta.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'vendedor' });

Venta.hasMany(VentaItem, { foreignKey: 'ventaId', as: 'items', onDelete: 'CASCADE' });
VentaItem.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Producto.hasMany(VentaItem, { foreignKey: 'productoId', as: 'ventasDetalle' });
VentaItem.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// Facturación
Emprendimiento.hasMany(Factura, { foreignKey: 'emprendimientoId', as: 'facturas' });
Factura.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Venta.hasMany(Factura, { foreignKey: 'ventaId', as: 'facturas' });
Factura.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Compra.hasMany(Factura, { foreignKey: 'compraId', as: 'facturas' });
Factura.belongsTo(Compra, { foreignKey: 'compraId', as: 'compra' });

// Administración y contabilidad
Emprendimiento.hasMany(MovimientoCaja, { foreignKey: 'emprendimientoId', as: 'movimientosCaja' });
MovimientoCaja.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Venta.hasMany(MovimientoCaja, { foreignKey: 'ventaId', as: 'movimientosCaja' });
MovimientoCaja.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Compra.hasMany(MovimientoCaja, { foreignKey: 'compraId', as: 'movimientosCaja' });
MovimientoCaja.belongsTo(Compra, { foreignKey: 'compraId', as: 'compra' });

// Marketing
Emprendimiento.hasMany(CampaniaMarketing, { foreignKey: 'emprendimientoId', as: 'campanias' });
CampaniaMarketing.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });

// Logística y envíos
Emprendimiento.hasMany(Envio, { foreignKey: 'emprendimientoId', as: 'envios' });
Envio.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId', as: 'emprendimiento' });
Venta.hasOne(Envio, { foreignKey: 'ventaId', as: 'envio' });
Envio.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Cliente.hasMany(Envio, { foreignKey: 'clienteId', as: 'envios' });
Envio.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

module.exports = {
  sequelize,
  Emprendimiento,
  Usuario,
  Proveedor,
  Insumo,
  Compra,
  CompraItem,
  Receta,
  RecetaInsumo,
  Producto,
  Cliente,
  Venta,
  VentaItem,
  Factura,
  MovimientoCaja,
  CampaniaMarketing,
  Envio,
};
