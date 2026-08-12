import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function ClientesPage() {
  return (
    <div className="page">
      <Header titulo="Clientes" />
      <div className="page__content">
        <EmptyState
          emoji="👥"
          titulo="Módulo de clientes en construcción"
          descripcion="Acá vas a poder ver historial de compras, saldo fiado y quiénes no compran hace tiempo."
        />
      </div>
    </div>
  );
}
