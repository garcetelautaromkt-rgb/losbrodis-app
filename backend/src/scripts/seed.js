require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, Emprendimiento, Usuario, Proveedor, Insumo, Receta, RecetaInsumo, Producto, Cliente,
} = require('../models');
const recetaController = require('../controllers/recetaController');

// Datos de ejemplo para probar la app rápidamente.
// Uso: npm run db:seed
async function run() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const emprendimiento = await Emprendimiento.create({
    nombre: 'Los Brodis',
    rubro: 'Gastronomía - Panadería artesanal',
    moneda: 'ARS',
  });

  const passwordHash = await bcrypt.hash('123456', 10);
  await Usuario.create({
    emprendimientoId: emprendimiento.id,
    nombre: 'Admin Los Brodis',
    email: 'admin@losbrodis.com',
    passwordHash,
    rol: 'admin',
  });

  const proveedor = await Proveedor.create({
    emprendimientoId: emprendimiento.id,
    nombre: 'Distribuidora Harinas SA',
    telefono: '+54 9 11 1234-5678',
  });

  const harina = await Insumo.create({
    emprendimientoId: emprendimiento.id,
    proveedorId: proveedor.id,
    nombre: 'Harina 000',
    unidadMedida: 'kg',
    stockActual: 25,
    stockMinimo: 5,
    costoUnitario: 900,
  });
  const azucar = await Insumo.create({
    emprendimientoId: emprendimiento.id,
    proveedorId: proveedor.id,
    nombre: 'Azúcar',
    unidadMedida: 'kg',
    stockActual: 10,
    stockMinimo: 2,
    costoUnitario: 1100,
  });
  const manteca = await Insumo.create({
    emprendimientoId: emprendimiento.id,
    proveedorId: proveedor.id,
    nombre: 'Manteca',
    unidadMedida: 'kg',
    stockActual: 6,
    stockMinimo: 1,
    costoUnitario: 4200,
  });

  const receta = await Receta.create({
    emprendimientoId: emprendimiento.id,
    nombre: 'Docena de facturas',
    descripcion: 'Receta base para una docena de facturas surtidas.',
    rendimiento: 12,
    costoManoObra: 800,
    costosAdicionales: 300,
    margenGanancia: 50,
    tipoMargen: 'sobre_costo',
  });

  await RecetaInsumo.bulkCreate([
    { recetaId: receta.id, insumoId: harina.id, cantidad: 1 },
    { recetaId: receta.id, insumoId: azucar.id, cantidad: 0.2 },
    { recetaId: receta.id, insumoId: manteca.id, cantidad: 0.3 },
  ]);

  await recetaController.recalcularYGuardar(receta);
  await receta.reload();

  await Producto.create({
    emprendimientoId: emprendimiento.id,
    recetaId: receta.id,
    nombre: 'Docena de facturas surtidas',
    categoria: 'Panadería',
    costoUnitario: receta.costoPorUnidad,
    margenGanancia: receta.margenGanancia,
    precioVenta: receta.precioSugerido,
    controlaStock: true,
    stockActual: 20,
    stockMinimo: 5,
  });

  await Cliente.create({
    emprendimientoId: emprendimiento.id,
    nombre: 'Cliente de ejemplo',
    tipo: 'individual',
    telefono: '+54 9 11 9999-0000',
    origen: 'Instagram',
  });

  console.log('✅ Datos de ejemplo creados.');
  console.log(`   Emprendimiento: ${emprendimiento.nombre} (${emprendimiento.id})`);
  console.log('   Usuario admin: admin@losbrodis.com / 123456');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error al cargar datos de ejemplo:', err);
  process.exit(1);
});
