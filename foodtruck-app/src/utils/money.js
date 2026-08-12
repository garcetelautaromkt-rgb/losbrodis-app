const formateador = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(valor) {
  return formateador.format(Number(valor) || 0);
}

export function toNumber(valor) {
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
