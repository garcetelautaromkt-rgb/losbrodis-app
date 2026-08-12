import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function GastosPage({ onVolver }) {
  return (
    <div className="page">
      <Header titulo="Gastos" onVolver={onVolver} />
      <div className="page__content">
        <EmptyState
          emoji="💸"
          titulo="Módulo de gastos en construcción"
          descripcion="Vas a poder registrar gastos por monto, categoría y fecha, con historial filtrable."
        />
      </div>
    </div>
  );
}
