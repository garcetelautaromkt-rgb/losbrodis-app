export default function EmptyState({ emoji = '📭', titulo, descripcion }) {
  return (
    <div className="empty-state">
      <div className="empty-state__emoji">{emoji}</div>
      <p className="empty-state__titulo">{titulo}</p>
      {descripcion && <p className="empty-state__descripcion">{descripcion}</p>}
    </div>
  );
}
