import { formatMoney } from './money';

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const ETIQUETA_MEDIO_PAGO = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  otro: 'Otro',
};

/**
 * Arma la nota de pedido en texto plano, lista para pegar en WhatsApp.
 * Se usa texto simple (sin tablas ni markdown raro) porque WhatsApp solo
 * respeta *negrita* y saltos de línea.
 */
export function generarNotaPedido({ items, total, tipoPago, medioPago, cliente, nota, negocio = 'Pedido' }) {
  const lineas = [];
  lineas.push(`*${negocio}* — ${formatoFecha.format(new Date())}`);
  if (cliente?.nombre) lineas.push(`Cliente: ${cliente.nombre}`);
  lineas.push('');

  items.forEach((item) => {
    const subtotal = (Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0);
    lineas.push(`${item.cantidad}× ${item.nombre} — ${formatMoney(subtotal)}`);
  });

  lineas.push('');
  lineas.push(`*Total: ${formatMoney(total)}*`);

  if (tipoPago === 'fiado') {
    lineas.push('Queda anotado en la cuenta 📝');
  } else {
    lineas.push(`Pago: ${ETIQUETA_MEDIO_PAGO[medioPago] || 'Efectivo'}`);
  }

  if (nota) {
    lineas.push('');
    lineas.push(nota);
  }

  lineas.push('');
  lineas.push('¡Gracias por tu compra! 🙌');

  return lineas.join('\n');
}

function soloDigitos(telefono) {
  return (telefono || '').replace(/\D/g, '');
}

/**
 * Comparte la nota. Intenta el menú nativo del sistema; si no está
 * disponible (o el usuario lo cancela) abre WhatsApp directo con el texto
 * precargado, y como último recurso copia al portapapeles.
 *
 * Nota: dentro de Capacitor conviene migrar a @capacitor/share, que expone
 * el share nativo de forma más confiable que navigator.share en el WebView.
 */
export async function compartirNota(texto, telefono) {
  if (navigator.share) {
    try {
      await navigator.share({ text: texto });
      return 'compartido';
    } catch (err) {
      // El usuario canceló el diálogo: no hay que abrir WhatsApp por las dudas.
      if (err?.name === 'AbortError') return 'cancelado';
    }
  }

  const numero = soloDigitos(telefono);
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  const ventana = window.open(url, '_blank');
  if (ventana) return 'whatsapp';

  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'error';
  }
}
