import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ClienteDetalleModal from './ClienteDetalleModal.jsx';
import { listarClientes, crearCliente } from '../db/repositories/clientesRepo.js';
import { resumenDeClientes } from '../db/repositories/ventasRepo.js';
import { formatMoney } from '../utils/money.js';
import { diasDesde } from '../utils/fechas.js';
import { IconMas2 } from '../components/icons.jsx';

// A partir de cuántos días sin comprar se marca a un cliente para
// contactarlo. Un puesto de comida vende seguido: dos semanas sin
// aparecer ya es señal de que se está yendo.
const DIAS_PARA_CONTACTAR = 15;

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(new Map());
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'deben' | 'contactar'
  const [detalle, setDetalle] = useState(null);
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [error, setError] = useState('');

  async function refrescar() {
    const [lista, mapa] = await Promise.all([listarClientes(), resumenDeClientes()]);
    setClientes(lista);
    setResumen(mapa);
    setCargando(false);
  }

  useEffect(() => {
    refrescar();
  }, []);

  const datosDe = (cliente) =>
    resumen.get(cliente.id) || { deuda: 0, ultimaCompra: null, cantidadCompras: 0, totalComprado: 0 };

  const paraContactar = (cliente) => {
    const { ultimaCompra } = datosDe(cliente);
    if (!ultimaCompra) return false;
    return diasDesde(ultimaCompra) >= DIAS_PARA_CONTACTAR;
  };

  const conDeuda = clientes.filter((c) => datosDe(c).deuda > 0);
  const inactivos = clientes.filter(paraContactar);

  const visibles =
    filtro === 'deben' ? conDeuda : filtro === 'contactar' ? inactivos : clientes;

  const deudaTotal = conDeuda.reduce((acc, c) => acc + datosDe(c).deuda, 0);

  async function handleCrear() {
    if (!nombreNuevo.trim()) {
      setError('Ingresá el nombre.');
      return;
    }
    await crearCliente({ nombre: nombreNuevo, telefono: telefonoNuevo });
    setNombreNuevo('');
    setTelefonoNuevo('');
    setCreando(false);
    setError('');
    refrescar();
  }

  return (
    <div className="page">
      <Header titulo="Clientes" />
      <div className="page__content">
        {deudaTotal > 0 && (
          <div className="banner-deuda">
            <span>Te deben en total</span>
            <strong>{formatMoney(deudaTotal)}</strong>
          </div>
        )}

        <div className="segmentado">
          <button type="button" className={filtro === 'todos' ? 'is-active' : ''} onClick={() => setFiltro('todos')}>
            Todos ({clientes.length})
          </button>
          <button type="button" className={filtro === 'deben' ? 'is-active' : ''} onClick={() => setFiltro('deben')}>
            Deben ({conDeuda.length})
          </button>
          <button
            type="button"
            className={filtro === 'contactar' ? 'is-active' : ''}
            onClick={() => setFiltro('contactar')}
          >
            Contactar ({inactivos.length})
          </button>
        </div>

        {cargando ? (
          <p className="ayuda-texto">Cargando…</p>
        ) : visibles.length === 0 ? (
          <EmptyState
            emoji={filtro === 'todos' ? '👥' : '👌'}
            titulo={
              filtro === 'deben'
                ? 'Nadie te debe plata'
                : filtro === 'contactar'
                  ? 'Todos tus clientes compraron hace poco'
                  : 'Todavía no cargaste clientes'
            }
            descripcion={
              filtro === 'todos'
                ? 'Podés crearlos desde acá, o directo al cobrar una venta fiada.'
                : ''
            }
          />
        ) : (
          <ul className="lista-clientes">
            {visibles.map((cliente) => {
              const { deuda, ultimaCompra, cantidadCompras } = datosDe(cliente);
              const dias = ultimaCompra ? diasDesde(ultimaCompra) : null;
              return (
                <li key={cliente.id}>
                  <button type="button" className="cliente-row" onClick={() => setDetalle(cliente)}>
                    <div className="cliente-row__info">
                      <strong>{cliente.nombre}</strong>
                      <small>
                        {cantidadCompras === 0
                          ? 'Sin compras todavía'
                          : dias === 0
                            ? `${cantidadCompras} compras · compró hoy`
                            : `${cantidadCompras} compras · hace ${dias} días`}
                      </small>
                    </div>
                    <div className="cliente-row__estado">
                      {deuda > 0 && <span className="badge badge--alerta">debe {formatMoney(deuda)}</span>}
                      {paraContactar(cliente) && <span className="badge badge--aviso">contactar</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button type="button" className="fab" onClick={() => setCreando(true)} aria-label="Nuevo cliente">
        <IconMas2 width={26} height={26} />
      </button>

      {creando && (
        <Modal
          titulo="Nuevo cliente"
          onClose={() => setCreando(false)}
          footer={
            <button type="button" className="btn btn--primario" onClick={handleCrear}>
              Guardar cliente
            </button>
          }
        >
          <div className="form">
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
            {error && <p className="mensaje-error">{error}</p>}
          </div>
        </Modal>
      )}

      {detalle && (
        <ClienteDetalleModal
          cliente={detalle}
          onClose={() => setDetalle(null)}
          onCambio={refrescar}
        />
      )}
    </div>
  );
}
