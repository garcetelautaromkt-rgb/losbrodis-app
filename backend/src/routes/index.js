const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/emprendimientos', require('./emprendimientoRoutes'));
router.use('/usuarios', require('./usuarioRoutes'));
router.use('/proveedores', require('./proveedorRoutes'));
router.use('/insumos', require('./insumoRoutes'));
router.use('/compras', require('./compraRoutes'));
router.use('/recetas', require('./recetaRoutes'));
router.use('/productos', require('./productoRoutes'));
router.use('/clientes', require('./clienteRoutes'));
router.use('/ventas', require('./ventaRoutes'));
router.use('/facturas', require('./facturaRoutes'));
router.use('/caja', require('./cajaRoutes'));
router.use('/campanias', require('./campaniaRoutes'));
router.use('/envios', require('./envioRoutes'));

module.exports = router;
