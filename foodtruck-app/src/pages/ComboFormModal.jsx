import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { crearCombo, actualizarCombo, eliminarCombo } from '../db/repositories/combosRepo.js';
import { listarPlatos } from '../db/repositories/platosRepo.js';
import { formatMoney, toNumber } from '../utils/money.js';
import { IconCerrar } from '../components/icons.jsx';

export default function ComboFormModal({ combo, onClose, onGuardado, onEliminado }) {
  const esEdicion = Boolean(combo);

  const [nombre, setNombre] = useState(combo?.nombre || '');
  const [precioEspecial, setPrecioEspecial] = useState(combo ? String(combo.precioEspecial) : '');
  const [items, setItems] = useState(combo?.items?.length ? combo.items : []);
  const [platosDisponibles, setPlatosDisponibles] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarPlatos().then(setPlatosDisponibles).catch(() => {});
  }, []);

  function agregarItem() {
    if (platosDisponibles.length === 0) return;
    setItems((prev) => [...prev, { platoId: platosDisponibles[0].id, cantidad: 1 }]);
  }

  function actualizarItem(index, cambios) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...cambios } : item)));
  }

  function quitarItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const precioSumaIndividual = items.reduce((total, item) => {
    const plato = platosDisponibles.find((p) => p.id === item.platoId);
    return total + (plato ? plato.precio * toNumber(item.cantidad) : 0);
  }, 0);
  const ahorro = precioSumaIndividual - toNumber(precioEspecial);

  async function handleGuardar(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresá un nombre.');
      return;
    }
    const itemsValidos = items.filter((i) => i.platoId && toNumber(i.cantidad) > 0);
    if (itemsValidos.length === 0) {
      setError('Agregá al menos un plato al combo.');
      return;
    }
    if (toNumber(precioEspecial) <= 0) {
      setError('Ingresá un precio especial válido.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      const datos = {
        nombre,
        precioEspecial: toNumber(precioEspecial),
        items: itemsValidos.map((i) => ({ platoId: i.platoId, cantidad: toNumber(i.cantidad) })),
      };
      if (esEdicion) {
        await actualizarCombo(combo.id, datos);
      } else {
        await crearCombo(datos);
      }
      onGuardado();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el combo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar el combo "${combo.nombre}"?`)) return;
    await eliminarCombo(combo.id);
    onEliminado();
  }

  return (
    <Modal titulo={esEdicion ? 'Editar combo' : 'Nuevo combo'} onClose={onClose}>
      <form className="form" onSubmit={handleGuardar}>
        <label className="campo">
          <span>Nombre del combo</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Combo hamburguesa + papas" autoFocus />
        </label>

        <label className="campo">
          <span>Precio especial</span>
          <input
            type="number"
            inputMode="decimal"
            value={precioEspecial}
            onChange={(e) => setPrecioEspecial(e.target.value)}
            placeholder="$ 0"
          />
        </label>

        <div className="seccion-receta">
          <h3>Platos incluidos</h3>

          {platosDisponibles.length === 0 ? (
            <p className="ayuda-texto">Cargá platos en el Catálogo primero.</p>
          ) : (
            <>
              {items.map((item, index) => (
                <div className="linea-receta" key={index}>
                  <select value={item.platoId} onChange={(e) => actualizarItem(index, { platoId: e.target.value })}>
                    {platosDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.cantidad}
                    onChange={(e) => actualizarItem(index, { cantidad: e.target.value })}
                  />
                  <button type="button" className="icon-button" onClick={() => quitarItem(index)}>
                    <IconCerrar width={16} height={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn--secundario btn--chico" onClick={agregarItem}>
                + Agregar plato
              </button>
            </>
          )}

          {items.length > 0 && (
            <p className="ayuda-texto">
              Suma individual: {formatMoney(precioSumaIndividual)}
              {ahorro > 0 && ` · Ahorro para el cliente: ${formatMoney(ahorro)}`}
            </p>
          )}
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear combo'}
        </button>

        {esEdicion && (
          <button type="button" className="btn btn--texto-peligro" onClick={handleEliminar}>
            Eliminar combo
          </button>
        )}
      </form>
    </Modal>
  );
}
