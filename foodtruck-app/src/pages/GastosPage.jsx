import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import {
  CATEGORIAS_GASTO,
  etiquetaCategoria,
  listarGastos,
  crearGasto,
  eliminarGasto,
} from '../db/repositories/gastosRepo.js';
import { formatMoney, toNumber } from '../utils/money.js';
import { rangoDelPeriodo, formatearFechaCorta, fechaDesdeInput, inputDesdeFecha } from '../utils/fechas.js';
import { IconMas2, IconCerrar } from '../components/icons.jsx';

const PERIODOS = [
  { id: 'dia', label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'todo', label: 'Todo' },
];

export default function GastosPage({ onVolver }) {
  const [periodo, setPeriodo] = useState('semana');
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);

  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('insumos');
  const [fecha, setFecha] = useState(inputDesdeFecha());
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const refrescar = useCallback(async () => {
    setCargando(true);
    const lista = await listarGastos(rangoDelPeriodo(periodo));
    setGastos(lista);
    setCargando(false);
  }, [periodo]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  async function handleCrear() {
    if (toNumber(monto) <= 0) {
      setError('Ingresá un monto mayor a cero.');
      return;
    }
    await crearGasto({
      monto: toNumber(monto),
      categoria,
      fecha: fechaDesdeInput(fecha),
      descripcion,
    });
    setMonto('');
    setDescripcion('');
    setFecha(inputDesdeFecha());
    setCreando(false);
    setError('');
    refrescar();
  }

  async function handleEliminar(gasto) {
    if (!window.confirm(`¿Borrar el gasto de ${formatMoney(gasto.monto)}?`)) return;
    await eliminarGasto(gasto.id);
    refrescar();
  }

  return (
    <div className="page">
      <Header titulo="Gastos" onVolver={onVolver} />
      <div className="page__content">
        <div className="chips">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={periodo === p.id ? 'is-active' : ''}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="banner-total">
          <span>Total gastado</span>
          <strong>{formatMoney(total)}</strong>
        </div>

        {cargando ? (
          <p className="ayuda-texto">Cargando…</p>
        ) : gastos.length === 0 ? (
          <EmptyState emoji="💸" titulo="No hay gastos en este período" />
        ) : (
          <ul className="lista-gastos">
            {gastos.map((gasto) => {
              const cat = etiquetaCategoria(gasto.categoria);
              return (
                <li key={gasto.id} className="gasto-row">
                  <span className="gasto-row__emoji">{cat.emoji}</span>
                  <div className="gasto-row__info">
                    <strong>{gasto.descripcion || cat.label}</strong>
                    <small>{cat.label} · {formatearFechaCorta(gasto.fecha)}</small>
                  </div>
                  <strong className="gasto-row__monto">{formatMoney(gasto.monto)}</strong>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleEliminar(gasto)}
                    aria-label="Borrar gasto"
                  >
                    <IconCerrar width={16} height={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button type="button" className="fab" onClick={() => setCreando(true)} aria-label="Nuevo gasto">
        <IconMas2 width={26} height={26} />
      </button>

      {creando && (
        <Modal
          titulo="Nuevo gasto"
          onClose={() => setCreando(false)}
          footer={
            <button type="button" className="btn btn--primario" onClick={handleCrear}>
              Guardar gasto
            </button>
          }
        >
          <div className="form">
            <label className="campo">
              <span>Monto</span>
              <input
                type="number"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="$ 0"
                autoFocus
              />
            </label>

            <div>
              <span className="etiqueta-grupo">Categoría</span>
              <div className="opciones-pago">
                {CATEGORIAS_GASTO.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`opcion-pago${categoria === c.id ? ' is-active' : ''}`}
                    onClick={() => setCategoria(c.id)}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="campo">
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>

            <label className="campo">
              <span>Descripción (opcional)</span>
              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: carne para el finde"
              />
            </label>

            {error && <p className="mensaje-error">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
