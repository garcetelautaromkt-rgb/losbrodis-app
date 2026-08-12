import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function TareasPage({ onVolver }) {
  return (
    <div className="page">
      <Header titulo="Organización" onVolver={onVolver} />
      <div className="page__content">
        <EmptyState
          emoji="🗒️"
          titulo="Tareas y calendario de publicaciones en construcción"
          descripcion="Lista simple de tareas con checkbox y un calendario semanal de qué publicar en redes."
        />
      </div>
    </div>
  );
}
