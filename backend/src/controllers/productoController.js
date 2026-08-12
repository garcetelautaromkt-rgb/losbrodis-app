const { Producto, Receta } = require('../models');
const { round2 } = require('../utils/pricing');

async function listar(req, res) {
  const productos = await Producto.findAll({
    where: { emprendimientoId: req.user.emprendimientoId },
    include: [{ association: 'receta', attributes: ['id', 'nombre', 'costoPorUnidad'] }],
    order: [['nombre', 'ASC']],
  });
  res.json(productos);
}

async function obtener(req, res) {
  const producto = await Producto.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
    include: [{
      association: 'receta',
      include: [{ association: 'insumos', include: [{ association: 'insumo' }] }],
    }],
  });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(producto);
}

// Calcula costo y precio de venta de un producto a partir de su receta (si tiene)
// o de los valores manuales enviados.
function calcularPrecioDesdeCosto(costoUnitario, margenGanancia) {
  const precio = Number(costoUnitario) * (1 + Number(margenGanancia) / 100);
  return round2(precio);
}

// POST /api/productos
// body: { nombre, categoria, descripcion, imagenUrl, recetaId, costoUnitario,
//         margenGanancia, precioVenta, controlaStock, stockActual, stockMinimo }
// Si se envía recetaId, el costo y precio sugerido se toman de la receta
// (a menos que se pase precioVenta explícito para sobrescribir).
async function crear(req, res) {
  const {
    nombre, categoria, descripcion, imagenUrl, recetaId,
    costoUnitario, margenGanancia, precioVenta,
    controlaStock, stockActual, stockMinimo,
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  let costoFinal = Number(costoUnitario) || 0;
  let precioFinal = precioVenta !== undefined ? Number(precioVenta) : undefined;
  const margen = margenGanancia ?? 40;

  if (recetaId) {
    const receta = await Receta.findOne({
      where: { id: recetaId, emprendimientoId: req.user.emprendimientoId },
    });
    if (!receta) return res.status(400).json({ error: 'La receta indicada no existe.' });
    costoFinal = Number(receta.costoPorUnidad);
    if (precioFinal === undefined) precioFinal = Number(receta.precioSugerido);
  }

  if (precioFinal === undefined) {
    precioFinal = calcularPrecioDesdeCosto(costoFinal, margen);
  }

  const producto = await Producto.create({
    emprendimientoId: req.user.emprendimientoId,
    recetaId: recetaId || null,
    nombre,
    categoria,
    descripcion,
    imagenUrl,
    costoUnitario: costoFinal,
    margenGanancia: margen,
    precioVenta: precioFinal,
    controlaStock: controlaStock ?? true,
    stockActual: stockActual || 0,
    stockMinimo: stockMinimo || 0,
  });

  res.status(201).json(producto);
}

async function actualizar(req, res) {
  const producto = await Producto.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

  const cambios = { ...req.body };

  // Si cambia el costo o el margen y no se especifica precio, se recalcula.
  if ((cambios.costoUnitario !== undefined || cambios.margenGanancia !== undefined) && cambios.precioVenta === undefined) {
    const costo = cambios.costoUnitario ?? producto.costoUnitario;
    const margen = cambios.margenGanancia ?? producto.margenGanancia;
    cambios.precioVenta = calcularPrecioDesdeCosto(costo, margen);
  }

  await producto.update(cambios);
  res.json(producto);
}

async function eliminar(req, res) {
  const producto = await Producto.findOne({
    where: { id: req.params.id, emprendimientoId: req.user.emprendimientoId },
  });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  await producto.update({ activo: false });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
