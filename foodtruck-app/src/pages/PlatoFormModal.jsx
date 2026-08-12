import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { crearPlato, actualizarPlato, eliminarPlato, listarCategorias } from '../db/repositories/platosRepo.js';
import { listarInsumos } from '../db/repositories/insumosRepo.js';
import { leerYRedimensionarImagen } from '../utils/image.js';
import { toNumber } from '../utils/money.js';
import { IconCerrar } from '../components/icons.jsx';

export default function PlatoFormModal({ plato, onClose, onGuardado, onEliminado }) {
  const esEdicion = Boolean(plato);

  const [nombre, setNombre] = useState(plato?.nombre || '');
  const [precio, setPrecio] = useState(plato ? String(plato.precio) : '');
  const [categoria, setCategoria] = useState(plato?.categoria || '');
  const [foto, setFoto] = useState(plato?.foto || null);
  const [receta, setReceta] = useState(plato?.receta?.length ? plato.receta : []);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarInsumos().then(setInsumosDisponibles).catch(() => {});
    listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await leerYRedimensionarImagen(file);
      setFoto(dataUrl);
    } catch {
      setError('No se pudo procesar la imagen.');
    }
  }

  function agregarLineaReceta() {
    if (insumosDisponibles.length === 0) return;
    setReceta((prev) => [...prev, { insumoId: insumosDisponibles[0].id, cantidad: 1 }]);
  }

  function actualizarLinea(index, cambios) {
    setReceta((prev) => prev.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea)));
  }

  function quitarLinea(index) {
    setReceta((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresá un nombre.');
      return;
    }
    if (toNumber(precio) <= 0) {
      setError('Ingresá un precio válido.');
      return;
    }
    setGuardando(true);
    setError('');

    const recetaValida = receta
      .filter((l) => l.insumoId && toNumber(l.cantidad) > 0)
      .map((l) => ({ insumoId: l.insumoId, cantidad: toNumber(l.cantidad) }));

    try {
      const datos = { nombre, precio: toNumber(precio), categoria, foto, receta: recetaValida };
      if (esEdicion) {
        await actualizarPlato(plato.id, datos);
      } else {
        await crearPlato(datos);
      }
      onGuardado();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el plato.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar "${plato.nombre}"?`)) return;
    await eliminarPlato(plato.id);
    onEliminado();
  }

  return (
    <Modal titulo={esEdicion ? 'Editar plato' : 'Nuevo plato'} onClose={onClose}>
      <form className="form" onSubmit={handleGuardar}>
        <div className="foto-selector">
          {foto ? (
            <div className="foto-preview">
              <img src={foto} alt="" />
              <button type="button" className="icon-button foto-preview__quitar" onClick={() => setFoto(null)}>
                <IconCerrar width={16} height={16} />
              </button>
            </div>
          ) : (
            <label className="foto-placeholder">
              <span>📷 Agregar foto</span>
              <input type="file" accept="image/*" onChange={handleFoto} hidden />
            </label>
          )}
        </div>

        <label className="campo">
          <span>Nombre del plato</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Hamburguesa clásica" autoFocus />
        </label>

        <div className="campo-fila">
          <label className="campo">
            <span>Precio</span>
            <input type="number" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="$ 0" />
          </label>
          <label className="campo">
            <span>Categoría</span>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ej: Hamburguesas"
              list="lista-categorias"
            />
            <datalist id="lista-categorias">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="seccion-receta">
          <h3>Receta (opcional)</h3>
          <p className="ayuda-texto">Insumos que se descuentan del stock al vender este plato.</p>

          {insumosDisponibles.length === 0 ? (
            <p className="ayuda-texto">Cargá insumos primero para poder armar la receta.</p>
          ) : (
            <>
              {receta.map((linea, index) => (
                <div className="linea-receta" key={index}>
                  <select
                    value={linea.insumoId}
                    onChange={(e) => actualizarLinea(index, { insumoId: e.target.value })}
                  >
                    {insumosDisponibles.map((i) => (
                      <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(index, { cantidad: e.target.value })}
                  />
                  <span className="linea-receta__unidad">
                    {insumosDisponibles.find((i) => i.id === linea.insumoId)?.unidad || ''}
                  </span>
                  <button type="button" className="icon-button" onClick={() => quitarLinea(index)}>
                    <IconCerrar width={16} height={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn--secundario btn--chico" onClick={agregarLineaReceta}>
                + Agregar insumo
              </button>
            </>
          )}
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear plato'}
        </button>

        {esEdicion && (
          <button type="button" className="btn btn--texto-peligro" onClick={handleEliminar}>
            Eliminar plato
          </button>
        )}
      </form>
    </Modal>
  );
}
