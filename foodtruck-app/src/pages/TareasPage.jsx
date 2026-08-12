import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import {
  PLATAFORMAS,
  etiquetaPlataforma,
  listarTareas,
  crearTarea,
  alternarTarea,
  eliminarTarea,
  listarPublicaciones,
  crearPublicacion,
  eliminarPublicacion,
} from '../db/repositories/organizacionRepo.js';
import {
  diasDeLaSemana,
  inicioDeSemana,
  finDeSemana,
  formatearFechaCorta,
  formatearDiaSemana,
  inputDesdeFecha,
  fechaDesdeInput,
  esHoy,
  diasDesde,
} from '../utils/fechas.js';
import { IconMas2, IconCerrar } from '../components/icons.jsx';

export default function TareasPage({ onVolver }) {
  const [tab, setTab] = useState('tareas'); // 'tareas' | 'calendario'

  return (
    <div className="page">
      <Header titulo="Organización" onVolver={onVolver} />
      <div className="page__content">
        <div className="segmentado">
          <button type="button" className={tab === 'tareas' ? 'is-active' : ''} onClick={() => setTab('tareas')}>
            Tareas
          </button>
          <button
            type="button"
            className={tab === 'calendario' ? 'is-active' : ''}
            onClick={() => setTab('calendario')}
          >
            Calendario
          </button>
        </div>

        {tab === 'tareas' ? <Tareas /> : <Calendario />}
      </div>
    </div>
  );
}

function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState(inputDesdeFecha());
  const [error, setError] = useState('');

  async function refrescar() {
    setTareas(await listarTareas());
    setCargando(false);
  }

  useEffect(() => {
    refrescar();
  }, []);

  async function handleCrear() {
    if (!texto.trim()) {
      setError('Escribí qué hay que hacer.');
      return;
    }
    await crearTarea({ texto, fecha: fechaDesdeInput(fecha) });
    setTexto('');
    setFecha(inputDesdeFecha());
    setCreando(false);
    setError('');
    refrescar();
  }

  async function handleAlternar(id) {
    await alternarTarea(id);
    refrescar();
  }

  async function handleEliminar(tarea) {
    if (!window.confirm(`¿Borrar "${tarea.texto}"?`)) return;
    await eliminarTarea(tarea.id);
    refrescar();
  }

  function textoVencimiento(tarea) {
    if (tarea.hecha) return 'Hecha';
    const dias = diasDesde(tarea.fecha);
    if (dias === 0) return 'Para hoy';
    if (dias > 0) return `Atrasada ${dias} ${dias === 1 ? 'día' : 'días'}`;
    return formatearFechaCorta(tarea.fecha);
  }

  return (
    <>
      {cargando ? (
        <p className="ayuda-texto">Cargando…</p>
      ) : tareas.length === 0 ? (
        <EmptyState
          emoji="🗒️"
          titulo="No tenés tareas anotadas"
          descripcion="Anotá lo que no querés olvidarte: publicar la promo del viernes, llamar al proveedor, etc."
        />
      ) : (
        <ul className="lista-tareas">
          {tareas.map((tarea) => {
            const atrasada = !tarea.hecha && diasDesde(tarea.fecha) > 0;
            return (
              <li key={tarea.id} className={`tarea-row${tarea.hecha ? ' is-hecha' : ''}`}>
                <label className="tarea-row__check">
                  <input type="checkbox" checked={tarea.hecha} onChange={() => handleAlternar(tarea.id)} />
                  <span />
                </label>
                <div className="tarea-row__info">
                  <strong>{tarea.texto}</strong>
                  <small className={atrasada ? 'texto-negativo' : ''}>{textoVencimiento(tarea)}</small>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => handleEliminar(tarea)}
                  aria-label="Borrar tarea"
                >
                  <IconCerrar width={16} height={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="fab" onClick={() => setCreando(true)} aria-label="Nueva tarea">
        <IconMas2 width={26} height={26} />
      </button>

      {creando && (
        <Modal
          titulo="Nueva tarea"
          onClose={() => setCreando(false)}
          footer={
            <button type="button" className="btn btn--primario" onClick={handleCrear}>
              Guardar tarea
            </button>
          }
        >
          <div className="form">
            <label className="campo">
              <span>¿Qué hay que hacer?</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ej: publicar promo del viernes"
                autoFocus
              />
            </label>
            <label className="campo">
              <span>¿Para cuándo?</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            {error && <p className="mensaje-error">{error}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

function Calendario() {
  const [semana, setSemana] = useState(() => inicioDeSemana());
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [diaElegido, setDiaElegido] = useState(null);
  const [texto, setTexto] = useState('');
  const [plataforma, setPlataforma] = useState('instagram');
  const [error, setError] = useState('');

  const dias = diasDeLaSemana(semana);

  const refrescar = useCallback(async () => {
    setCargando(true);
    const lista = await listarPublicaciones({
      desde: inicioDeSemana(semana),
      hasta: finDeSemana(semana),
    });
    setPublicaciones(lista);
    setCargando(false);
  }, [semana]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  function moverSemana(deltaDias) {
    const nueva = new Date(semana);
    nueva.setDate(nueva.getDate() + deltaDias);
    setSemana(inicioDeSemana(nueva));
  }

  function publicacionesDe(dia) {
    return publicaciones.filter(
      (p) => new Date(p.fecha).toDateString() === dia.toDateString()
    );
  }

  async function handleCrear() {
    if (!texto.trim()) {
      setError('Escribí qué querés publicar.');
      return;
    }
    await crearPublicacion({ texto, fecha: diaElegido, plataforma });
    setTexto('');
    setDiaElegido(null);
    setError('');
    refrescar();
  }

  async function handleEliminar(publicacion) {
    if (!window.confirm(`¿Borrar "${publicacion.texto}"?`)) return;
    await eliminarPublicacion(publicacion.id);
    refrescar();
  }

  return (
    <>
      <div className="navegador-semana">
        <button type="button" className="icon-button" onClick={() => moverSemana(-7)} aria-label="Semana anterior">
          ‹
        </button>
        <span>
          {formatearFechaCorta(dias[0])} al {formatearFechaCorta(dias[6])}
        </span>
        <button type="button" className="icon-button" onClick={() => moverSemana(7)} aria-label="Semana siguiente">
          ›
        </button>
      </div>

      {cargando ? (
        <p className="ayuda-texto">Cargando…</p>
      ) : (
        <div className="calendario">
          {dias.map((dia) => {
            const delDia = publicacionesDe(dia);
            return (
              <div key={dia.toISOString()} className={`dia-calendario${esHoy(dia) ? ' es-hoy' : ''}`}>
                <div className="dia-calendario__cabecera">
                  <strong>{formatearDiaSemana(dia)}</strong>
                  <small>{formatearFechaCorta(dia)}</small>
                </div>

                {delDia.map((publicacion) => {
                  const plat = etiquetaPlataforma(publicacion.plataforma);
                  return (
                    <div key={publicacion.id} className="publicacion">
                      <span>{plat.emoji}</span>
                      <span className="publicacion__texto">{publicacion.texto}</span>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleEliminar(publicacion)}
                        aria-label="Borrar publicación"
                      >
                        <IconCerrar width={14} height={14} />
                      </button>
                    </div>
                  );
                })}

                <button type="button" className="dia-calendario__agregar" onClick={() => setDiaElegido(dia)}>
                  + Agregar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {diaElegido && (
        <Modal
          titulo={`Publicar el ${formatearDiaSemana(diaElegido)} ${formatearFechaCorta(diaElegido)}`}
          onClose={() => setDiaElegido(null)}
          footer={
            <button type="button" className="btn btn--primario" onClick={handleCrear}>
              Guardar
            </button>
          }
        >
          <div className="form">
            <label className="campo">
              <span>¿Qué vas a publicar?</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ej: foto de la hamburguesa nueva"
                autoFocus
              />
            </label>
            <div>
              <span className="etiqueta-grupo">¿Dónde?</span>
              <div className="opciones-plataforma">
                {PLATAFORMAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`opcion-pago${plataforma === p.id ? ' is-active' : ''}`}
                    onClick={() => setPlataforma(p.id)}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="mensaje-error">{error}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
