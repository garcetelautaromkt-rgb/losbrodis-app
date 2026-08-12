import { IconVolver } from './icons.jsx';

export default function Header({ titulo, onVolver, accion }) {
  return (
    <header className="app-header">
      {onVolver ? (
        <button type="button" className="icon-button" onClick={onVolver} aria-label="Volver">
          <IconVolver width={22} height={22} />
        </button>
      ) : (
        <span className="app-header__spacer" />
      )}
      <h1>{titulo}</h1>
      {accion || <span className="app-header__spacer" />}
    </header>
  );
}
