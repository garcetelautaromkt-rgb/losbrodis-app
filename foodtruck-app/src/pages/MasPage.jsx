import Header from '../components/Header.jsx';
import { IconInsumos, IconGastos, IconTareas } from '../components/icons.jsx';

const OPCIONES = [
  { id: 'insumos', label: 'Insumos', descripcion: 'Stock, mínimos y mermas', Icon: IconInsumos },
  { id: 'gastos', label: 'Gastos', descripcion: 'Registro de gastos del negocio', Icon: IconGastos },
  { id: 'tareas', label: 'Organización', descripcion: 'Tareas y calendario de publicaciones', Icon: IconTareas },
];

export default function MasPage({ onIr }) {
  return (
    <div className="page">
      <Header titulo="Más" />
      <div className="page__content">
        <div className="lista-opciones">
          {OPCIONES.map(({ id, label, descripcion, Icon }) => (
            <button key={id} type="button" className="opcion-card" onClick={() => onIr(id)}>
              <span className="opcion-card__icono">
                <Icon width={26} height={26} />
              </span>
              <span className="opcion-card__texto">
                <strong>{label}</strong>
                <small>{descripcion}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
