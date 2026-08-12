import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PlatoFormModal from './PlatoFormModal.jsx';
import ComboFormModal from './ComboFormModal.jsx';
import { listarPlatos } from '../db/repositories/platosRepo.js';
import { listarCombos } from '../db/repositories/combosRepo.js';
import { formatMoney } from '../utils/money.js';
import { IconMas2 } from '../components/icons.jsx';

export default function CatalogoPage() {
  const [tab, setTab] = useState('platos'); // 'platos' | 'combos'
  const [platos, setPlatos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalPlato, setModalPlato] = useState(null); // null | 'nuevo' | plato
  const [modalCombo, setModalCombo] = useState(null); // null | 'nuevo' | combo

  async function refrescar() {
    const [listaPlatos, listaCombos] = await Promise.all([listarPlatos(), listarCombos()]);
    setPlatos(listaPlatos);
    setCombos(listaCombos);
    setCargando(false);
  }

  useEffect(() => {
    refrescar();
  }, []);

  function handleGuardadoPlato() {
    setModalPlato(null);
    refrescar();
  }

  function handleEliminadoPlato() {
    setModalPlato(null);
    refrescar();
  }

  function handleGuardadoCombo() {
    setModalCombo(null);
    refrescar();
  }

  function handleEliminadoCombo() {
    setModalCombo(null);
    refrescar();
  }

  function nombrePlato(platoId) {
    return platos.find((p) => p.id === platoId)?.nombre || 'Plato eliminado';
  }

  return (
    <div className="page">
      <Header titulo="Catálogo" />
      <div className="page__content">
        <div className="segmentado">
          <button type="button" className={tab === 'platos' ? 'is-active' : ''} onClick={() => setTab('platos')}>
            Platos ({platos.length})
          </button>
          <button type="button" className={tab === 'combos' ? 'is-active' : ''} onClick={() => setTab('combos')}>
            Combos ({combos.length})
          </button>
        </div>

        {cargando ? (
          <p className="ayuda-texto">Cargando…</p>
        ) : tab === 'platos' ? (
          platos.length === 0 ? (
            <EmptyState
              emoji="🍽️"
              titulo="Todavía no cargaste platos"
              descripcion="Creá tu primer plato: nombre, precio y opcionalmente la receta de insumos que consume."
            />
          ) : (
            <div className="grid-platos">
              {platos.map((plato) => (
                <button key={plato.id} type="button" className="plato-card" onClick={() => setModalPlato(plato)}>
                  {plato.foto ? (
                    <img src={plato.foto} alt="" className="plato-card__foto" />
                  ) : (
                    <div className="plato-card__foto plato-card__foto--vacia">🍽️</div>
                  )}
                  <div className="plato-card__info">
                    <strong>{plato.nombre}</strong>
                    {plato.categoria && <small>{plato.categoria}</small>}
                    <span className="plato-card__precio">{formatMoney(plato.precio)}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : combos.length === 0 ? (
          <EmptyState
            emoji="🎁"
            titulo="Todavía no armaste combos"
            descripcion="Combiná platos existentes con un precio especial de promo."
          />
        ) : (
          <ul className="lista-combos">
            {combos.map((combo) => (
              <li key={combo.id}>
                <button type="button" className="combo-card" onClick={() => setModalCombo(combo)}>
                  <div className="combo-card__info">
                    <strong>{combo.nombre}</strong>
                    <small>{combo.items.map((i) => `${i.cantidad}× ${nombrePlato(i.platoId)}`).join(' + ')}</small>
                  </div>
                  <span className="plato-card__precio">{formatMoney(combo.precioEspecial)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="fab"
        aria-label={tab === 'platos' ? 'Nuevo plato' : 'Nuevo combo'}
        onClick={() => (tab === 'platos' ? setModalPlato('nuevo') : setModalCombo('nuevo'))}
      >
        <IconMas2 width={26} height={26} />
      </button>

      {modalPlato && (
        <PlatoFormModal
          plato={modalPlato === 'nuevo' ? null : modalPlato}
          onClose={() => setModalPlato(null)}
          onGuardado={handleGuardadoPlato}
          onEliminado={handleEliminadoPlato}
        />
      )}

      {modalCombo && (
        <ComboFormModal
          combo={modalCombo === 'nuevo' ? null : modalCombo}
          onClose={() => setModalCombo(null)}
          onGuardado={handleGuardadoCombo}
          onEliminado={handleEliminadoCombo}
        />
      )}
    </div>
  );
}
