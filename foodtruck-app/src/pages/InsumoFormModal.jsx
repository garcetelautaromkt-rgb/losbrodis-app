import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import {
  UNIDADES,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  ajustarStock,
  listarMovimientos,
} from '../db/repositories/insumosRepo.js';
import { formatMoney, toNumber } from '../utils/money.js';

const ETIQUETA_MOVIMIENTO = {
  compra: 'Ingreso de stock',
  merma: 'Merma',
  ajuste: 'Ajuste manual',
  venta: 'Descuento por venta',
};

export default function InsumoFormModal({ insumo, onClose, onGuardado, onEliminado }) {
  const esEdicion = Boolean(insumo);

  const [nombre, setNombre] = useState(insumo?.nombre || '');
  const [unidad, setUnidad] = useState(insumo?.unidad || 'unidad');
  const [stockInicial, setStockInicial] = useState(insumo ? String(insumo.stock) : '0');
  const [stockMinimo, setStockMinimo] = useState(insumo ? String(insumo.stockMinimo) : '0');
  const [costoUnitario, setCostoUnitario] = useState(insumo ? String(insumo.costoUnitario || '') : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [movimientos, setMovimientos] = useState([]);
  const [tipoAjuste, setTipoAjuste] = useState(null); // 'compra' | 'merma' | null
  const [cantidadAjuste, setCantidadAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [ajustando, setAjustando] = useState(false);

  useEffect(() => {
    if (esEdicion) {
      listarMovimientos(insumo.id).then(setMovimientos).catch(() => {});
    }
  }, [esEdicion, insumo]);

  async function handleGuardar(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresá un nombre.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (esEdicion) {
        await actualizarInsumo(insumo.id, {
          nombre,
          unidad,
          stockMinimo: toNumber(stockMinimo),
          costoUnitario: toNumber(costoUnitario),
        });
      } else {
        await crearInsumo({
          nombre,
          unidad,
          stock: toNumber(stockInicial),
          stockMinimo: toNumber(stockMinimo),
          costoUnitario: toNumber(costoUnitario),
        });
      }
      onGuardado();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el insumo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar "${insumo.nombre}"? Los platos que lo usan en su receta van a quedar sin ese insumo.`)) return;
    await eliminarInsumo(insumo.id);
    onEliminado();
  }

  async function handleConfirmarAjuste() {
    const cantidad = toNumber(cantidadAjuste);
    if (cantidad <= 0) {
      setError('Ingresá una cantidad mayor a cero.');
      return;
    }
    if (tipoAjuste === 'merma' && !motivoAjuste.trim()) {
      setError('Indicá el motivo de la merma (dañado, vencido, etc.).');
      return;
    }
    setAjustando(true);
    setError('');
    try {
      const delta = tipoAjuste === 'merma' ? -cantidad : cantidad;
      const { movimiento } = await ajustarStock(insumo.id, delta, { tipo: tipoAjuste, motivo: motivoAjuste });
      setMovimientos((prev) => [movimiento, ...prev].slice(0, 5));
      setTipoAjuste(null);
      setCantidadAjuste('');
      setMotivoAjuste('');
      onGuardado({ mantenerAbierto: true });
    } catch (err) {
      setError(err.message || 'No se pudo registrar el ajuste.');
    } finally {
      setAjustando(false);
    }
  }

  return (
    <Modal titulo={esEdicion ? 'Editar insumo' : 'Nuevo insumo'} onClose={onClose}>
      <form className="form" onSubmit={handleGuardar}>
        <label className="campo">
          <span>Nombre del insumo</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Harina" autoFocus />
        </label>

        <div className="campo-fila">
          <label className="campo">
            <span>Unidad</span>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>

          {!esEdicion && (
            <label className="campo">
              <span>Stock inicial</span>
              <input
                type="number"
                inputMode="decimal"
                value={stockInicial}
                onChange={(e) => setStockInicial(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="campo-fila">
          <label className="campo">
            <span>Stock mínimo (alerta)</span>
            <input
              type="number"
              inputMode="decimal"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Costo unitario (opcional)</span>
            <input
              type="number"
              inputMode="decimal"
              value={costoUnitario}
              onChange={(e) => setCostoUnitario(e.target.value)}
              placeholder="$ 0"
            />
          </label>
        </div>

        {esEdicion && (
          <div className="stock-actual">
            Stock actual: <strong>{insumo.stock} {insumo.unidad}</strong>
          </div>
        )}

        {error && <p className="mensaje-error">{error}</p>}

        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear insumo'}
        </button>
      </form>

      {esEdicion && (
        <div className="seccion-ajuste">
          <h3>Ajustar stock</h3>
          {!tipoAjuste ? (
            <div className="campo-fila">
              <button type="button" className="btn btn--secundario" onClick={() => setTipoAjuste('compra')}>
                + Agregar stock
              </button>
              <button type="button" className="btn btn--peligro-suave" onClick={() => setTipoAjuste('merma')}>
                − Registrar merma
              </button>
            </div>
          ) : (
            <div className="form">
              <label className="campo">
                <span>Cantidad ({insumo.unidad})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(e.target.value)}
                />
              </label>
              <label className="campo">
                <span>Motivo {tipoAjuste === 'merma' ? '(obligatorio)' : '(opcional)'}</span>
                <input
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder={tipoAjuste === 'merma' ? 'Ej: se venció, se cayó' : 'Ej: compra proveedor'}
                />
              </label>
              <div className="campo-fila">
                <button type="button" className="btn btn--fantasma" onClick={() => setTipoAjuste(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn--primario" onClick={handleConfirmarAjuste} disabled={ajustando}>
                  {ajustando ? 'Guardando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {movimientos.length > 0 && (
            <div className="lista-movimientos">
              <h4>Últimos movimientos</h4>
              {movimientos.map((m) => (
                <div key={m.id} className="movimiento-item">
                  <span>{ETIQUETA_MOVIMIENTO[m.tipo] || m.tipo}</span>
                  <span className={m.delta < 0 ? 'texto-negativo' : 'texto-positivo'}>
                    {m.delta > 0 ? '+' : ''}{m.delta} {insumo.unidad}
                  </span>
                  {m.motivo && <small>{m.motivo}</small>}
                </div>
              ))}
            </div>
          )}

          {insumo.costoUnitario > 0 && (
            <p className="ayuda-texto">Costo unitario actual: {formatMoney(insumo.costoUnitario)}</p>
          )}

          <button type="button" className="btn btn--texto-peligro" onClick={handleEliminar}>
            Eliminar insumo
          </button>
        </div>
      )}
    </Modal>
  );
}
