import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';
import InsumoFormModal from './InsumoFormModal.jsx';
import { listarInsumos, estaBajoStock, obtenerInsumo } from '../db/repositories/insumosRepo.js';
import { IconMas2, IconAlerta } from '../components/icons.jsx';

export default function InsumosPage({ onVolver }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'bajoStock'
  const [modal, setModal] = useState(null); // null | 'nuevo' | insumo

  async function refrescar() {
    const lista = await listarInsumos();
    setInsumos(lista);
    setCargando(false);
  }

  useEffect(() => {
    refrescar();
  }, []);

  async function handleGuardado(opts) {
    await refrescar();
    if (opts?.mantenerAbierto && modal && modal !== 'nuevo') {
      const actualizado = await obtenerInsumo(modal.id);
      setModal(actualizado);
    } else {
      setModal(null);
    }
  }

  function handleEliminado() {
    setModal(null);
    refrescar();
  }

  const visibles = filtro === 'bajoStock' ? insumos.filter(estaBajoStock) : insumos;
  const cantidadBajoStock = insumos.filter(estaBajoStock).length;

  return (
    <div className="page">
      <Header titulo="Insumos" onVolver={onVolver} />
      <div className="page__content">
        <div className="segmentado">
          <button
            type="button"
            className={filtro === 'todos' ? 'is-active' : ''}
            onClick={() => setFiltro('todos')}
          >
            Todos ({insumos.length})
          </button>
          <button
            type="button"
            className={filtro === 'bajoStock' ? 'is-active' : ''}
            onClick={() => setFiltro('bajoStock')}
          >
            Bajo stock ({cantidadBajoStock})
          </button>
        </div>

        {cargando ? (
          <p className="ayuda-texto">Cargando…</p>
        ) : visibles.length === 0 ? (
          <EmptyState
            emoji="🧺"
            titulo={filtro === 'bajoStock' ? 'Ningún insumo está bajo de stock' : 'Todavía no cargaste insumos'}
            descripcion={filtro === 'bajoStock' ? '' : 'Agregá tu materia prima para poder armar recetas y controlar el stock.'}
          />
        ) : (
          <ul className="lista-insumos">
            {visibles.map((insumo) => {
              const bajo = estaBajoStock(insumo);
              return (
                <li key={insumo.id}>
                  <button type="button" className="insumo-row" onClick={() => setModal(insumo)}>
                    <span className="insumo-row__nombre">
                      {insumo.nombre}
                      {bajo && (
                        <span className="badge badge--alerta">
                          <IconAlerta width={14} height={14} /> bajo stock
                        </span>
                      )}
                    </span>
                    <span className="insumo-row__stock">
                      {insumo.stock} {insumo.unidad}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button type="button" className="fab" onClick={() => setModal('nuevo')} aria-label="Nuevo insumo">
        <IconMas2 width={26} height={26} />
      </button>

      {modal && (
        <InsumoFormModal
          insumo={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onGuardado={handleGuardado}
          onEliminado={handleEliminado}
        />
      )}
    </div>
  );
}
