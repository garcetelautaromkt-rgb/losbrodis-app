// Helpers de fechas. Todo se maneja en hora local del dispositivo:
// un puesto de comida piensa en "lo que vendí hoy", no en UTC.

export function inicioDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function finDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Semana de lunes a domingo (así se piensa una semana de trabajo acá). */
export function inicioDeSemana(fecha = new Date()) {
  const d = inicioDelDia(fecha);
  const diaSemana = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - diaSemana);
  return d;
}

export function finDeSemana(fecha = new Date()) {
  const d = inicioDeSemana(fecha);
  d.setDate(d.getDate() + 6);
  return finDelDia(d);
}

export function inicioDeMes(fecha = new Date()) {
  const d = inicioDelDia(fecha);
  d.setDate(1);
  return d;
}

export function finDeMes(fecha = new Date()) {
  const d = inicioDeMes(fecha);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return finDelDia(d);
}

/** periodo: 'dia' | 'semana' | 'mes' | 'todo' */
export function rangoDelPeriodo(periodo, fecha = new Date()) {
  if (periodo === 'semana') return { desde: inicioDeSemana(fecha), hasta: finDeSemana(fecha) };
  if (periodo === 'mes') return { desde: inicioDeMes(fecha), hasta: finDeMes(fecha) };
  if (periodo === 'todo') return { desde: null, hasta: null };
  return { desde: inicioDelDia(fecha), hasta: finDelDia(fecha) };
}

export function estaEnRango(fechaIso, { desde, hasta }) {
  const f = new Date(fechaIso);
  if (desde && f < desde) return false;
  if (hasta && f > hasta) return false;
  return true;
}

/**
 * Convierte el valor de un <input type="date"> ('2026-08-12') a un Date en
 * hora local. Ojo: new Date('2026-08-12') lo interpreta como UTC y en
 * Argentina (UTC-3) termina cayendo el día anterior — por eso se arma a mano.
 */
export function fechaDesdeInput(valor) {
  if (!valor) return new Date();
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Date(anio, mes - 1, dia, 12, 0, 0, 0);
}

/** Pasa un Date/ISO al formato 'YYYY-MM-DD' que espera <input type="date">. */
export function inputDesdeFecha(fecha = new Date()) {
  const d = new Date(fecha);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const fmtCorta = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' });
const fmtLarga = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtHora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' });
const fmtDiaSemana = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });

export function formatearFechaCorta(fecha) {
  return fmtCorta.format(new Date(fecha));
}

export function formatearFechaLarga(fecha) {
  return fmtLarga.format(new Date(fecha));
}

export function formatearHora(fecha) {
  return fmtHora.format(new Date(fecha));
}

export function formatearDiaSemana(fecha) {
  const texto = fmtDiaSemana.format(new Date(fecha));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Días enteros transcurridos desde una fecha hasta hoy. */
export function diasDesde(fecha) {
  const desde = inicioDelDia(new Date(fecha));
  const hoy = inicioDelDia();
  return Math.round((hoy - desde) / (1000 * 60 * 60 * 24));
}

export function esHoy(fecha) {
  return inicioDelDia(new Date(fecha)).getTime() === inicioDelDia().getTime();
}

/** Los 7 días (lunes a domingo) de la semana que contiene a `fecha`. */
export function diasDeLaSemana(fecha = new Date()) {
  const inicio = inicioDeSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}
