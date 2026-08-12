/**
 * Algoritmo de costeo de recetas y sugerencia de precio de venta.
 *
 * costoInsumos      = Σ (cantidad usada en la receta * costo unitario del insumo)
 * costoProduccion   = costoInsumos + costoManoObra + costosAdicionales
 * costoPorUnidad    = costoProduccion / rendimiento   (rendimiento = unidades que produce la receta)
 *
 * Sugerencia de precio, según el tipo de margen configurado:
 *  - 'sobre_costo'  (markup):  precio = costoPorUnidad * (1 + margen/100)
 *      Ej: costo $100, margen 40% -> precio $140
 *  - 'sobre_precio' (margen objetivo sobre el precio final): precio = costoPorUnidad / (1 - margen/100)
 *      Ej: costo $100, margen 40% -> precio $166.67 (el costo representa el 60% del precio final)
 */
function calcularCostoReceta({ recetaInsumos, insumosMap, costoManoObra = 0, costosAdicionales = 0, rendimiento = 1 }) {
  const costoInsumos = recetaInsumos.reduce((acc, ri) => {
    const insumo = insumosMap.get(String(ri.insumoId));
    const costoUnitario = insumo ? Number(insumo.costoUnitario) : 0;
    return acc + Number(ri.cantidad) * costoUnitario;
  }, 0);

  const costoProduccion = costoInsumos + Number(costoManoObra) + Number(costosAdicionales);
  const unidadesProducidas = Number(rendimiento) > 0 ? Number(rendimiento) : 1;
  const costoPorUnidad = costoProduccion / unidadesProducidas;

  return {
    costoInsumos: round2(costoInsumos),
    costoProduccion: round2(costoProduccion),
    costoPorUnidad: round2(costoPorUnidad),
  };
}

function calcularPrecioSugerido({ costoPorUnidad, margenGanancia = 0, tipoMargen = 'sobre_costo' }) {
  const margen = Number(margenGanancia) / 100;
  let precio;

  if (tipoMargen === 'sobre_precio') {
    if (margen >= 1) {
      throw badRequest('El margen sobre precio debe ser menor a 100%.');
    }
    precio = costoPorUnidad / (1 - margen);
  } else {
    precio = costoPorUnidad * (1 + margen);
  }

  const gananciaUnitaria = precio - costoPorUnidad;
  const margenReal = precio > 0 ? (gananciaUnitaria / precio) * 100 : 0;

  return {
    precioSugerido: round2(precio),
    gananciaUnitaria: round2(gananciaUnitaria),
    margenRealSobrePrecio: round2(margenReal),
  };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

module.exports = { calcularCostoReceta, calcularPrecioSugerido, round2 };
