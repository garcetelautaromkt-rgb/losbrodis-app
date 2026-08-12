import { useCallback, useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { actualizarCliente, eliminarCliente, registrarPago, listarPagos } from '../db/repositories/clientesRepo.js';
import { listarVentasDeCliente, saldoFiado } from '../db/repositories/ventasRepo.js';
import { formatMoney, toNumber } from '../utils/money.js';
import { formatearFechaCorta, formatearHora, diasDesde } from '../utils/fechas.js';

export default function ClienteDetalleModal({ cliente, onClose, onCambio }) {
  const [tab, setTab] = useState('resumen'); // 'resumen' | 'datos'
  const [ventas, setVentas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [deuda, setDeuda] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [cobrando, setCobrando] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(cliente.telefono || '');

  const refrescar = useCallback(async () => {
    const [v, p, d] = await Promise.all([
      listarVentasDeCliente(cliente.id),
      listarPagos(cliente.id),
      saldoFiado(cliente.id),
    ]);
    setVentas(v);
    setPagos(p);
    setDeuda(d);
    setCargando(false);
  }, [cliente.id]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  async function handleRegistrarPago() {
    const monto = toNumber(montoPago);
    if (monto <= 0) {
      setError('Ingresá un monto mayor a cero.');
      return;
    }
    await registrarPago({ clienteId: cliente.id, monto, nota: 'Pago de deuda' });
    setMontoPago('');
    setCobrando(false);
    setError('');
    await refrescar();
    onCambio();
  }

  async function handleGuardarDatos() {
    if (!nombre.trim()) {
      setError('El nombre no puede quedar vacío.');
      return;
    }
    await actualizarCliente(cliente.id, { nombre: nombre.trim(), telefono: telefono.trim() });
    setError('');
    onCambio();
    onClose();
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar a "${cliente.nombre}"? Sus ventas quedan registradas igual.`)) return;
    await eliminarCliente(cliente.id);
    onCambio();
    onClose();
  }

  function abrirWhatsApp() {
    const numero = (cliente.telefono || '').replace(/\D/g, '');
    if (!numero) return;
    window.open(`https://wa.me/${numero}`, '_blank');
  }

  const ultimaCompra = ventas[0]?.fecha;

  return (
    <Modal titulo={cliente.nombre} onClose={onClose}>
      <div className="segmentado">
        <button type="button" className={tab === 'resumen' ? 'is-active' : ''} onClick={() => setTab('resumen')}>
          Cuenta
        </button>
        <button type="button" className={tab === 'datos' ? 'is-active' : ''} onClick={() => setTab('datos')}>
          Datos
        </button>
      </div>

      {tab === 'resumen' ? (
        <div className="form">
          <div className={`tarjeta-deuda${deuda > 0 ? ' tiene-deuda' : ''}`}>
            <small>{deuda > 0 ? 'Debe' : 'Sin deuda'}</small>
            <strong>{formatMoney(deuda)}</strong>
            {ultimaCompra && (
              <small>
                Última compra: {formatearFechaCorta(ultimaCompra)}
                {diasDesde(ultimaCompra) > 0 && ` (hace ${diasDesde(ultimaCompra)} días)`}
              </small>
            )}
          </div>

          {deuda > 0 &&
            (cobrando ? (
              <div className="alta-rapida">
                <label className="campo">
                  <span>¿Cuánto te pagó?</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    autoFocus
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder={String(deuda)}
                  />
                </label>
                <div className="campo-fila">
                  <button type="button" className="btn btn--fantasma" onClick={() => setCobrando(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn--primario" onClick={handleRegistrarPago}>
                    Registrar pago
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn--secundario btn--chico"
                  onClick={() => setMontoPago(String(deuda))}
                >
                  Pagó todo ({formatMoney(deuda)})
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn--primario" onClick={() => setCobrando(true)}>
                Registrar pago
              </button>
            ))}

          {cliente.telefono && (
            <button type="button" className="btn btn--secundario" onClick={abrirWhatsApp}>
              Escribirle por WhatsApp
            </button>
          )}

          {error && <p className="mensaje-error">{error}</p>}

          <div className="historial">
            <h3>Historial</h3>
            {cargando ? (
              <p className="ayuda-texto">Cargando…</p>
            ) : ventas.length === 0 && pagos.length === 0 ? (
              <p className="ayuda-texto">Todavía no hay movimientos.</p>
            ) : (
              <ul className="lista-historial">
                {ventas.map((venta) => (
                  <li key={venta.id} className="historial-item">
                    <div>
                      <strong>
                        {venta.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}
                      </strong>
                      <small>
                        {formatearFechaCorta(venta.fecha)} {formatearHora(venta.fecha)}
                        {venta.tipoPago === 'fiado' && (venta.pagada ? ' · fiado saldado' : ' · fiado')}
                      </small>
                    </div>
                    <strong className={venta.tipoPago === 'fiado' && !venta.pagada ? 'texto-negativo' : ''}>
                      {formatMoney(venta.total)}
                    </strong>
                  </li>
                ))}
                {pagos.map((pago) => (
                  <li key={pago.id} className="historial-item">
                    <div>
                      <strong>Pago recibido</strong>
                      <small>{formatearFechaCorta(pago.fecha)} {formatearHora(pago.fecha)}</small>
                    </div>
                    <strong className="texto-positivo">−{formatMoney(pago.monto)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="form">
          <label className="campo">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="campo">
            <span>Teléfono</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              inputMode="tel"
              placeholder="Ej: 3415551234"
            />
          </label>
          {error && <p className="mensaje-error">{error}</p>}
          <button type="button" className="btn btn--primario" onClick={handleGuardarDatos}>
            Guardar cambios
          </button>
          <button type="button" className="btn btn--texto-peligro" onClick={handleEliminar}>
            Eliminar cliente
          </button>
        </div>
      )}
    </Modal>
  );
}
