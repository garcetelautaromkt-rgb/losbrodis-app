import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import { totalesDeVentas, resumenDeClientes } from '../db/repositories/ventasRepo.js';
import { totalGastos } from '../db/repositories/gastosRepo.js';
import { listarInsumos, estaBajoStock } from '../db/repositories/insumosRepo.js';
import { formatMoney } from '../utils/money.js';
import { rangoDelPeriodo } from '../utils/fechas.js';
import { IconAlerta } from '../components/icons.jsx';

const PERIODOS = [
  { id: 'dia', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
];

export default function InicioPage({ onIr }) {
  const [periodo, setPeriodo] = useState('dia');
  const [ventas, setVentas] = useState({ total: 0, cantidad: 0, cobrado: 0, fiadoPendiente: 0 });
  const [gastos, setGastos] = useState(0);
  const [bajoStock, setBajoStock] = useState([]);
  const [deudaTotal, setDeudaTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);

    const rango = rangoDelPeriodo(periodo);
    Promise.all([
      totalesDeVentas(rango),
      totalGastos(rango),
      listarInsumos(),
      resumenDeClientes(),
    ]).then(([totalesVentas, totalDeGastos, insumos, resumenClientes]) => {
      if (cancelado) return;
      setVentas(totalesVentas);
      setGastos(totalDeGastos);
      setBajoStock(insumos.filter(estaBajoStock));
      let deuda = 0;
      resumenClientes.forEach((r) => {
        deuda += r.deuda;
      });
      setDeudaTotal(deuda);
      setCargando(false);
    });

    return () => {
      cancelado = true;
    };
  }, [periodo]);

  const ganancia = ventas.total - gastos;

  return (
    <div className="page">
      <Header titulo="Inicio" />
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

        {cargando ? (
          <p className="ayuda-texto">Cargando…</p>
        ) : (
          <>
            <div className={`tarjeta-ganancia${ganancia < 0 ? ' es-negativa' : ''}`}>
              <small>Ganancia neta</small>
              <strong>{formatMoney(ganancia)}</strong>
              <small>
                {ventas.cantidad === 0
                  ? 'Todavía no vendiste nada en este período'
                  : `${ventas.cantidad} ${ventas.cantidad === 1 ? 'venta' : 'ventas'}`}
              </small>
            </div>

            <div className="grilla-resumen">
              <div className="tarjeta-resumen">
                <small>Ventas</small>
                <strong className="texto-positivo">{formatMoney(ventas.total)}</strong>
                {ventas.fiadoPendiente > 0 && (
                  <small>Incluye {formatMoney(ventas.fiadoPendiente)} fiado sin cobrar</small>
                )}
              </div>
              <div className="tarjeta-resumen">
                <small>Gastos</small>
                <strong className="texto-negativo">{formatMoney(gastos)}</strong>
              </div>
            </div>

            {ventas.fiadoPendiente > 0 && (
              <div className="tarjeta-resumen tarjeta-resumen--ancha">
                <small>Entró en efectivo/transferencia</small>
                <strong>{formatMoney(ventas.cobrado)}</strong>
              </div>
            )}

            <h3 className="titulo-seccion">Para tener en cuenta</h3>

            {bajoStock.length === 0 && deudaTotal === 0 && (
              <p className="ayuda-texto">Todo en orden: no hay insumos bajos ni deudas pendientes. 👌</p>
            )}

            {bajoStock.length > 0 && (
              <button type="button" className="aviso-accion" onClick={() => onIr('insumos')}>
                <IconAlerta width={20} height={20} />
                <div>
                  <strong>
                    {bajoStock.length} {bajoStock.length === 1 ? 'insumo bajo' : 'insumos bajos'} de stock
                  </strong>
                  <small>{bajoStock.map((i) => i.nombre).join(', ')}</small>
                </div>
              </button>
            )}

            {deudaTotal > 0 && (
              <button type="button" className="aviso-accion" onClick={() => onIr('clientes')}>
                <span className="aviso-accion__emoji">📒</span>
                <div>
                  <strong>Te deben {formatMoney(deudaTotal)}</strong>
                  <small>Tocá para ver quién y registrar los pagos</small>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
