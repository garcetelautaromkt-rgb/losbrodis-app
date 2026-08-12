import { IconInicio, IconVender, IconCatalogo, IconClientes, IconMas } from './icons.jsx';

const TABS = [
  { id: 'inicio', label: 'Inicio', Icon: IconInicio },
  { id: 'vender', label: 'Vender', Icon: IconVender },
  { id: 'catalogo', label: 'Catálogo', Icon: IconCatalogo },
  { id: 'clientes', label: 'Clientes', Icon: IconClientes },
  { id: 'mas', label: 'Más', Icon: IconMas },
];

// Las sub-vistas (insumos, gastos, tareas) cuelgan de "Más" y se muestran
// como activo el ícono "Más" para no confundir con menús anidados.
const GRUPO_MAS = new Set(['mas', 'insumos', 'gastos', 'tareas']);

export default function BottomNav({ vistaActual, onCambiarVista }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {TABS.map(({ id, label, Icon }) => {
        const activo = id === 'mas' ? GRUPO_MAS.has(vistaActual) : vistaActual === id;
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item${activo ? ' is-active' : ''}`}
            onClick={() => onCambiarVista(id)}
          >
            <Icon width={24} height={24} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
