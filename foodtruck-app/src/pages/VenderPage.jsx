import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Pantalla de venta rápida (grid de platos/combos + carrito + cierre con
// fiado y nota para WhatsApp). Se construye en la próxima etapa, una vez
// que Catálogo e Insumos ya tienen datos cargados.
export default function VenderPage() {
  return (
    <div className="page">
      <Header titulo="Vender" />
      <div className="page__content">
        <EmptyState
          emoji="🛒"
          titulo="La pantalla de venta rápida es el próximo paso"
          descripcion="Primero cargá tus platos e insumos en Catálogo — la venta va a usar esos datos para descontar stock automáticamente."
        />
      </div>
    </div>
  );
}
