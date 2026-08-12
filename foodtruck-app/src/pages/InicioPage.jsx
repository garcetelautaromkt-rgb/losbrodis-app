import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Resumen de ventas/gastos/ganancia del día — se completa cuando se
// construyan los módulos de Ventas y Gastos (siguiente etapa).
export default function InicioPage() {
  return (
    <div className="page">
      <Header titulo="Inicio" />
      <div className="page__content">
        <EmptyState
          emoji="📊"
          titulo="El resumen del día llega en la próxima etapa"
          descripcion="Cuando estén listos Ventas y Gastos, acá vas a ver ventas, gastos y ganancia neta de hoy, la semana y el mes."
        />
      </div>
    </div>
  );
}
