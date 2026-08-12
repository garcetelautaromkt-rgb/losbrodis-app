import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { crearVenta, detectarStockInsuficiente } from '../db/repositories/ventasRepo.js';
import { listarClientes, crearCliente, obtenerCliente } from '../db/repositories/clientesRepo.js';
import { listarInsumos } from '../db/repositories/insumosRepo.js';
import { generarNotaPedido, compartirNota } from '../utils/nota.js';
import { formatMoney } from '../utils/money.js';
import { IconAlerta } from '../components/icons.jsx';

const MEDIOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'otro', label: 'Otro' },
];

export default function CerrarVentaModal({ items, total, platos, combos, onCancelar, onVentaCerrada }) {
  const [tipoPago, setTipoPago] = useState('inmediato');
  const [medioPago, setMedioPago] = useState('efectivo');
  const [clienteId, setClienteId] = useState('');
  const [nota, setNota] = useState('');
  const [clientes, setClientes] = useState([]);
  const [faltantes, setFaltantes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Alta rápida de cliente sin salir del cobro.
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');

  // Estado post-venta: nota lista para compartir.
  const [ventaCerrada, setVentaCerrada] = useState(null);
  const [mensajeCompartir, setMensajeCompartir] = useState('');

  useEffect(() => {
    listarClientes().then(setClientes).catch(() => {});
    listarInsumos()
      .then((insumos) => setFaltantes(detectarStockInsuficiente(items, platos, combos, insumos)))
      .catch(() => {});
  }, [items, platos, combos]);

  async function handleCrearCliente() {
    if (!nombreNuevo.trim()) {
      setError('Ingresá el nombre del cliente.');
      return;
    }
    const cliente = await crearCliente({ nombre: nombreNuevo, telefono: telefonoNuevo });
    setClientes((prev) => [...prev, cliente].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    setClienteId(cliente.id);
    setCreandoCliente(false);
    setNombreNuevo('');
    setTelefonoNuevo('');
    setError('');
  }

  async function handleConfirmar() {
    if (tipoPago === 'fiado' && !clienteId) {
      setError('Elegí a nombre de quién queda el fiado.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await crearVenta({ items, tipoPago, medioPago, clienteId: clienteId || null, nota });
      const cliente = clienteId ? await obtenerCliente(clienteId) : null;
      const texto = generarNotaPedido({ items, total, tipoPago, medioPago, cliente, nota });
      setVentaCerrada({ texto, cliente });
    } catch (err) {
      setError(err.message || 'No se pudo registrar la venta.');
      setGuardando(false);
    }
  }

  async function handleCompartir() {
    const resultado = await compartirNota(ventaCerrada.texto, ventaCerrada.cliente?.telefono);
    if (resultado === 'copiado') setMensajeCompartir('Nota copiada al portapapeles.');
    if (resultado === 'error') setMensajeCompartir('No se pudo compartir. Copiá el texto de arriba a mano.');
  }

  if (ventaCerrada) {
    return (
      <Modal
        titulo="¡Venta registrada!"
        onClose={onVentaCerrada}
        footer={
          <button type="button" className="btn btn--fantasma" onClick={onVentaCerrada}>
            Listo
          </button>
        }
      >
        <div className="form">
          <div className="venta-ok">
            <span className="venta-ok__emoji">✅</span>
            <strong>{formatMoney(total)}</strong>
            <small>
              {tipoPago === 'fiado'
                ? `Anotado en la cuenta de ${ventaCerrada.cliente?.nombre}`
                : `Cobrado en ${MEDIOS_PAGO.find((m) => m.id === medioPago)?.label.toLowerCase()}`}
            </small>
          </div>

          <pre className="nota-preview">{ventaCerrada.texto}</pre>

          <button type="button" className="btn btn--primario" onClick={handleCompartir}>
            Compartir por WhatsApp
          </button>
          {mensajeCompartir && <p className="ayuda-texto">{mensajeCompartir}</p>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      titulo={`Cobrar ${formatMoney(total)}`}
      onClose={onCancelar}
      footer={
        <button type="button" className="btn btn--primario" onClick={handleConfirmar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Confirmar venta'}
        </button>
      }
    >
      <div className="form">
        {faltantes.length > 0 && (
          <div className="aviso-stock">
            <IconAlerta width={18} height={18} />
            <div>
              <strong>Ojo con el stock</strong>
              {faltantes.map((f) => (
                <small key={f.insumo.id}>
                  {f.insumo.nombre}: necesitás {f.necesario} {f.insumo.unidad} y tenés {f.disponible}.
                </small>
              ))}
              <small>Igual podés cerrar la venta, el stock queda en cero.</small>
            </div>
          </div>
        )}

        <div className="segmentado">
          <button
            type="button"
            className={tipoPago === 'inmediato' ? 'is-active' : ''}
            onClick={() => setTipoPago('inmediato')}
          >
            Pago ahora
          </button>
          <button
            type="button"
            className={tipoPago === 'fiado' ? 'is-active' : ''}
            onClick={() => setTipoPago('fiado')}
          >
            Fiado
          </button>
        </div>

        {tipoPago === 'inmediato' && (
          <div className="opciones-pago">
            {MEDIOS_PAGO.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`opcion-pago${medioPago === m.id ? ' is-active' : ''}`}
                onClick={() => setMedioPago(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <label className="campo">
          <span>{tipoPago === 'fiado' ? 'Cliente (a quién se le fía)' : 'Cliente (opcional)'}</span>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">— Sin cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>

        {creandoCliente ? (
          <div className="alta-rapida">
            <div className="campo-fila">
              <label className="campo">
                <span>Nombre</span>
                <input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} autoFocus />
              </label>
              <label className="campo">
                <span>Teléfono</span>
                <input
                  value={telefonoNuevo}
                  onChange={(e) => setTelefonoNuevo(e.target.value)}
                  inputMode="tel"
                  placeholder="Ej: 3415551234"
                />
              </label>
            </div>
            <div className="campo-fila">
              <button type="button" className="btn btn--fantasma" onClick={() => setCreandoCliente(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--secundario" onClick={handleCrearCliente}>
                Guardar cliente
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => setCreandoCliente(true)}>
            + Cliente nuevo
          </button>
        )}

        <label className="campo">
          <span>Nota para el pedido (opcional)</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: retira 20:30, sin cebolla"
          />
        </label>

        {error && <p className="mensaje-error">{error}</p>}
      </div>
    </Modal>
  );
}
