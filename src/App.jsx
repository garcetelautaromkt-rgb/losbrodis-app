import { useState, useEffect } from "react";

const TURNOS = ["Mañana", "Tarde"];
const CATEGORIAS_GASTO = ["Insumos", "Alquiler", "Servicios", "Limpieza", "Otros"];
const METODOS_PAGO = ["Efectivo", "Transferencia"];
const MODALIDADES_VENTA = ["Unidad", "Media docena (6)", "Docena (12)"];
const MODALIDAD_MULT = { "Unidad": 1, "Media docena (6)": 6, "Docena (12)": 12 };

const formatARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const today = () => new Date().toISOString().split("T")[0];

const DIAS_SEMANA = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

// Configuración de horarios por defecto (índice 0 = Domingo ... 6 = Sábado)
const HORARIOS_DEFAULT = [
  { abierto: false, texto: "" },
  { abierto: true,  texto: "7:30 – 13:00 / 16:00 – 21:00" },
  { abierto: true,  texto: "7:30 – 13:00 / 16:00 – 21:00" },
  { abierto: true,  texto: "7:30 – 13:00 / 16:00 – 21:00" },
  { abierto: true,  texto: "7:30 – 13:00 / 16:00 – 21:00" },
  { abierto: true,  texto: "7:30 – 13:00 / 16:00 – 21:00" },
  { abierto: true,  texto: "8:00 – 13:00" },
];


const getDayName = () => DIAS_SEMANA[new Date().getDay()];

// Formato YYYY-MM-DD en horario local (evita bugs de zona horaria con toISOString)
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

// Estado real de un día: revisa primero si hay una excepción puntual,
// si no, usa la configuración semanal por defecto
const getEstadoDia = (date, horarios, excepciones) => {
  const key = fmtDate(date);
  const base = horarios[date.getDay()] || { abierto: false, texto: "" };
  if (excepciones && key in excepciones) {
    const abierto = excepciones[key];
    return { abierto, texto: abierto ? (base.texto || "Horario especial") : "" };
  }
  return { abierto: base.abierto, texto: base.texto };
};

const getHorario = (horarios, excepciones) => {
  const estado = getEstadoDia(new Date(), horarios, excepciones);
  if (!estado.abierto) return null;
  return estado.texto || null;
};

const getWeekLabel = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const m = d.toLocaleString("es-AR", { month: "long" });
  return `${m.charAt(0).toUpperCase() + m.slice(1)} - Semana ${Math.ceil(d.getDate() / 7)}`;
};

const getDiasHabiles = (horarios) => {
  const now = new Date(); const y = now.getFullYear(); const mo = now.getMonth();
  const total = new Date(y, mo + 1, 0).getDate();
  let h = 0;
  for (let d = 1; d <= total; d++) {
    const dia = new Date(y, mo, d).getDay();
    if (horarios[dia]?.abierto) h++;
  }
  return h;
};

const TABS = [
  { id: "Inicio",        icon: "⬡", label: "Inicio"   },
  { id: "Ventas",        icon: "🛒", label: "Ventas"   },
  { id: "Gastos",        icon: "💸", label: "Gastos"   },
  { id: "Stock",         icon: "📦", label: "Stock"    },
  { id: "Resumen",       icon: "📊", label: "Resumen"  },
  { id: "Configuración", icon: "⚙️", label: "Config."  },
];

// Marcadores únicos para detectar cada campo en el link de Google Forms
const MARKERS = {
  fecha:          "MARCA_FECHA_01",
  turno:          "MARCA_TURNO_02",
  efectivo:       "MARCA_EFECTIVO_03",
  transferencia:  "MARCA_TRANSFER_04",
  gastoEfectivo:  "MARCA_GASTOEF_05",
  efectivoNeto:   "MARCA_NETO_06",
  totalVentasDia: "MARCA_VENTASDIA_07",
  totalGastosDia: "MARCA_GASTOSDIA_08",
  gananciaDia:    "MARCA_GANANCIA_09",
  semana:         "MARCA_SEMANA_10",
  peDiario:       "MARCA_PEDIARIO_11",
};

const CAMPOS_FORM = [
  { key: "fecha",          label: "Fecha" },
  { key: "turno",          label: "Turno" },
  { key: "efectivo",       label: "Efectivo cobrado" },
  { key: "transferencia",  label: "Transferencias" },
  { key: "gastoEfectivo",  label: "Gastos en efectivo" },
  { key: "efectivoNeto",   label: "Efectivo en caja" },
  { key: "totalVentasDia", label: "Total ventas del dia" },
  { key: "totalGastosDia", label: "Total gastos del dia" },
  { key: "gananciaDia",    label: "Ganancia del dia" },
  { key: "semana",         label: "Semana" },
  { key: "peDiario",       label: "PE diario" },
];

// Parsea un link "pre-llenado" de Google Forms y extrae form ID + entry IDs
const parseFormLink = (url) => {
  try {
    const u = new URL(url.trim());
    const m = u.pathname.match(/\/forms\/d\/e\/([^/]+)\//) || u.pathname.match(/\/forms\/d\/([^/]+)\//);
    if (!m) return null;
    const formId = m[1];
    const entries = {};
    for (const [key, value] of u.searchParams.entries()) {
      if (!key.startsWith("entry.")) continue;
      const fieldKey = Object.entries(MARKERS).find(([, marker]) => marker === value)?.[0];
      if (fieldKey) entries[fieldKey] = key;
    }
    return { formId, entries };
  } catch {
    return null;
  }
};

const C = {
  bg: "#0f0f0f", surface: "#141414", surface2: "#181818",
  border: "#232323", border2: "#2a2a2a",
  gold: "#c8a96e", goldDim: "#c8a96e22",
  green: "#4caf7d", greenDim: "#0e2a1a",
  red: "#e07070", redDim: "#1a0e0e",
  blue: "#6a9fd8",
  text: "#f5f0e8", muted: "#888", dim: "#444", vdim: "#333",
};

const S = {
  label: { display: "block", fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "11px 13px", color: C.text, fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" },
  btnPrimary: { width: "100%", background: C.gold, border: "none", borderRadius: 10, padding: "14px 0", color: "#0f0f0f", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, transition: "opacity 0.2s" },
  btnDanger: { width: "100%", background: "#7a2020", border: "none", borderRadius: 10, padding: "14px 0", color: C.text, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  btnGhost: { flex: 1, padding: "12px 0", border: `1px solid ${C.border}`, borderRadius: 10, background: "none", color: C.muted, fontSize: 14, cursor: "pointer" },
  card: (bg, accent) => ({ background: bg, border: `1px solid ${accent}33`, borderRadius: 12, padding: 16 }),
  section: { fontSize: 10, color: C.dim, marginBottom: 12, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 600 },
  row: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },
  chip: (active, color) => ({ flex: 1, padding: "10px 4px", border: `1px solid ${active ? color : C.border2}`, borderRadius: 8, background: active ? color + "18" : C.surface2, color: active ? color : C.dim, fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }),
};

export default function App() {
  const [tab, setTab] = useState("Inicio");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch { return JSON.parse(d); } };
  const [ventas,  setVentas]  = useState(() => load("lb5_ventas",  "[]"));
  const [gastos,  setGastos]  = useState(() => load("lb5_gastos",  "[]"));
  const [stock,   setStock]   = useState(() => load("lb5_stock",   "[]"));
  const [cierres, setCierres] = useState(() => load("lb5_cierres", "[]"));
  const [formConfig, setFormConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lb5_formconfig") || "null"); } catch { return null; }
  });
  const [horarios, setHorarios] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lb5_horarios") || "null");
      return (saved && saved.length === 7) ? saved : HORARIOS_DEFAULT;
    } catch { return HORARIOS_DEFAULT; }
  });
  const [editSheets, setEditSheets] = useState(false);
  const [linkTemp, setLinkTemp] = useState("");
  const [linkError, setLinkError] = useState("");
  const [sheetsSending, setSheetsSending] = useState(false);
  const [cierreModal, setCierreModal] = useState(false);
  const [cierreTurno, setCierreTurno] = useState("Mañana");
  const [filtroFecha, setFiltroFecha] = useState(today());
  const [ok, setOk] = useState(""); const showOk = m => { setOk(m); setTimeout(() => setOk(""), 2200); };
  const [err, setErr] = useState(""); const showErr = m => { setErr(m); setTimeout(() => setErr(""), 2500); };

  const [venta, setVenta] = useState({ fecha: today(), turno: "Mañana", producto: "", modalidad: "Unidad", cantidad: 1, precioUnidad: "", metodoPago: "Efectivo" });
  const [gasto, setGasto] = useState({ fecha: today(), categoria: "Alquiler", descripcion: "", monto: "", metodoPago: "Efectivo", estadoPago: "Abonado", esFijo: false, fechaVencimiento: "" });
  const [stockItem, setStockItem] = useState({ fecha: today(), nombre: "", cantidad: "", unidad: "unidades", tipo: "entrada" });

  useEffect(() => { localStorage.setItem("lb5_ventas",  JSON.stringify(ventas));  }, [ventas]);
  useEffect(() => { localStorage.setItem("lb5_gastos",  JSON.stringify(gastos));  }, [gastos]);
  useEffect(() => { localStorage.setItem("lb5_stock",   JSON.stringify(stock));   }, [stock]);
  useEffect(() => { localStorage.setItem("lb5_cierres", JSON.stringify(cierres)); }, [cierres]);
  useEffect(() => { localStorage.setItem("lb5_formconfig", JSON.stringify(formConfig)); }, [formConfig]);
  useEffect(() => { localStorage.setItem("lb5_horarios", JSON.stringify(horarios)); }, [horarios]);

  // Stock calculado
  const stockActual = {};
  stock.forEach(s => {
    if (!stockActual[s.nombre]) stockActual[s.nombre] = { cantidad: 0, unidad: s.unidad };
    stockActual[s.nombre].cantidad += s.tipo === "entrada" ? +s.cantidad : -+s.cantidad;
  });
  const productosDisponibles = Object.keys(stockActual).filter(p => stockActual[p].cantidad > 0);

  // PE desde gastos fijos
  const gastosFijos = gastos.filter(g => g.esFijo);
  const totalFijos = gastosFijos.reduce((a, b) => a + b.monto, 0);
  const diasHabiles = getDiasHabiles(horarios);
  const peDiario = diasHabiles > 0 ? Math.ceil(totalFijos / diasHabiles) : 0;

  // Dashboard hoy
  const ventasHoy = ventas.filter(v => v.fecha === today());
  const totalHoy  = ventasHoy.reduce((a, b) => a + b.total, 0);
  const gastosHoy = gastos.filter(g => g.fecha === today() && g.estadoPago === "Abonado").reduce((a, b) => a + b.monto, 0);
  const gananciaHoy = totalHoy - gastosHoy;
  const faltaPE = Math.max(0, peDiario - totalHoy);
  const pct = peDiario > 0 ? Math.min(100, (totalHoy / peDiario) * 100) : 0;
  const barColor = pct >= 100 ? C.green : pct >= 60 ? C.gold : C.red;

  const conteo = {};
  ventasHoy.forEach(v => { conteo[v.producto] = (conteo[v.producto] || 0) + (v.unidadesDescontadas || 1); });
  const estrella = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

  const creditosVencidos = gastos.filter(g => g.estadoPago === "A crédito" && g.fechaVencimiento && g.fechaVencimiento < today());
  const gastosCredito = gastos.filter(g => g.estadoPago === "A crédito");

  // Resumen día
  const ventasDia = ventas.filter(v => v.fecha === filtroFecha);
  const gastosDia = gastos.filter(g => g.fecha === filtroFecha);
  const totalVD = ventasDia.reduce((a, b) => a + b.total, 0);
  const totalGD = gastosDia.filter(g => g.estadoPago === "Abonado").reduce((a, b) => a + b.monto, 0);
  const ganDia = totalVD - totalGD;
  const gastosCat = {};
  gastosDia.forEach(g => { gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + g.monto; });

  const totalUV = parseInt(venta.cantidad || 0) * MODALIDAD_MULT[venta.modalidad];
  const totalVA = parseFloat(venta.precioUnidad || 0) * parseInt(venta.cantidad || 0);

  // Acciones
  const agregarVenta = () => {
    if (!venta.producto) return showErr("Seleccioná un producto");
    if (!venta.precioUnidad || !venta.cantidad) return showErr("Completá precio y cantidad");
    const u = totalUV;
    const disp = stockActual[venta.producto]?.cantidad || 0;
    if (u > disp) return showErr(`Stock insuficiente · quedan ${disp}`);
    setVentas(p => [...p, { ...venta, id: Date.now(), unidadesDescontadas: u, precioUnidad: +venta.precioUnidad, total: totalVA }]);
    setStock(p => [...p, { id: Date.now()+1, fecha: venta.fecha, nombre: venta.producto, cantidad: u, unidad: stockActual[venta.producto]?.unidad || "unidades", tipo: "salida" }]);
    setVenta(v => ({ ...v, cantidad: 1, precioUnidad: "" }));
    showOk("✓ Venta registrada");
  };

  const agregarGasto = () => {
    if (!gasto.monto || !gasto.descripcion) return showErr("Completá descripción y monto");
    if (gasto.estadoPago === "A crédito" && !gasto.fechaVencimiento) return showErr("Indicá fecha de vencimiento");
    setGastos(p => [...p, { ...gasto, id: Date.now(), monto: +gasto.monto }]);
    setGasto(g => ({ ...g, descripcion: "", monto: "", fechaVencimiento: "" }));
    showOk("✓ Gasto registrado");
  };

  const agregarStock = () => {
    if (!stockItem.nombre || !stockItem.cantidad) return showErr("Completá nombre y cantidad");
    setStock(p => [...p, { ...stockItem, id: Date.now(), cantidad: +stockItem.cantidad }]);
    setStockItem(s => ({ ...s, nombre: "", cantidad: "" }));
    showOk("✓ Stock actualizado");
  };

  const enviarAForm = async (datos) => {
    const params = new URLSearchParams();
    Object.entries(formConfig.entries).forEach(([campo, entryId]) => {
      params.append(entryId, String(datos[campo] ?? ""));
    });
    await fetch(`https://docs.google.com/forms/d/e/${formConfig.formId}/formResponse`, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  };

  const hacerCierre = async () => {
    const vt = ventas.filter(v => v.fecha === today() && v.turno === cierreTurno);
    const ef = vt.filter(v => v.metodoPago === "Efectivo").reduce((a,b) => a+b.total, 0);
    const tr = vt.filter(v => v.metodoPago === "Transferencia").reduce((a,b) => a+b.total, 0);
    const ge = gastos.filter(g => g.fecha === today() && g.metodoPago === "Efectivo" && g.estadoPago === "Abonado").reduce((a,b) => a+b.monto, 0);
    const tvd = ventas.filter(v => v.fecha === today()).reduce((a,b) => a+b.total, 0);
    const tgd = gastos.filter(g => g.fecha === today() && g.estadoPago === "Abonado").reduce((a,b) => a+b.monto, 0);
    const nc = { id: Date.now(), fecha: today(), turno: cierreTurno, efectivo: ef, transferencia: tr, gastoEfectivo: ge, efectivoNeto: ef-ge, total: ef+tr, totalVentasDia: tvd, totalGastosDia: tgd, gananciaDia: tvd-tgd };
    setCierres(p => [...p, nc]);
    setCierreModal(false);
    showOk("✓ Cierre registrado");
    if (formConfig?.formId && formConfig?.entries) {
      setSheetsSending(true);
      try {
        const datos = { ...nc, semana: getWeekLabel(today()), peDiario };
        await enviarAForm(datos);
        showOk("✓ Enviado al Sheets");
      } catch { showErr("⚠ Error al enviar al Sheets"); }
      setSheetsSending(false);
    }
  };

  // ── LAYOUT ──────────────────────────────────────────────────────────
  const content = (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? 80 : 24 }}>

      {/* ── INICIO ── */}
      {tab === "Inicio" && (
        <div style={{ padding: isMobile ? 16 : 28 }}>

          {creditosVencidos.length > 0 && (
            <div style={{ background: "#2a0e0e", border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 4 }}>⚠️ {creditosVencidos.length} crédito{creditosVencidos.length > 1 ? "s" : ""} vencido{creditosVencidos.length > 1 ? "s" : ""}</div>
              {creditosVencidos.map(g => <div key={g.id} style={{ fontSize: 12, color: C.muted }}>{g.descripcion} · {formatARS(g.monto)} · vence {g.fechaVencimiento}</div>)}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
            {/* Estrella */}
            {estrella ? (
              <div style={{ background: "linear-gradient(135deg,#2a1f0e,#1a1510)", border: `1px solid ${C.gold}33`, borderRadius: 14, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>⭐ Producto estrella hoy</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>{estrella[0]}</div>
                <div style={{ fontSize: 12, color: C.dim }}>{estrella[1]} unidades vendidas</div>
              </div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.vdim }}>Sin ventas hoy todavía</div>
              </div>
            )}

            {/* PE */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.dim, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 600 }}>Punto de equilibrio</div>
                <span style={{ fontSize: 10, color: C.vdim }}>automático</span>
              </div>
              {peDiario === 0 ? (
                <div style={{ fontSize: 12, color: C.dim, textAlign: "center", padding: "8px 0" }}>Cargá costos fijos en Gastos para calcular el PE</div>
              ) : (
                <>
                  <div style={{ background: "#1e1e1e", borderRadius: 99, height: 8, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, background: barColor, height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.dim }}>Ventas hoy</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: barColor }}>{formatARS(totalHoy)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {faltaPE > 0 ? <>
                        <div style={{ fontSize: 11, color: C.dim }}>Falta</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>{formatARS(faltaPE)}</div>
                      </> : <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>✓ PE alcanzado</div>}
                    </div>
                  </div>
                  <div style={{ background: C.surface2, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: C.dim }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Costos fijos del mes</span><span style={{ color: C.muted }}>{formatARS(totalFijos)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>PE diario ({diasHabiles} días hábiles)</span><span style={{ color: C.gold, fontWeight: 700 }}>{formatARS(peDiario)}</span></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cards resumen */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div style={S.card(C.greenDim, C.green)}>
              <div style={{ fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Ventas hoy</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatARS(totalHoy)}</div>
            </div>
            <div style={S.card(C.redDim, C.red)}>
              <div style={{ fontSize: 10, color: C.red, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Gastos hoy</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatARS(gastosHoy)}</div>
            </div>
            <div style={{ ...S.card(gananciaHoy >= 0 ? C.greenDim : C.redDim, gananciaHoy >= 0 ? C.green : C.red), gridColumn: isMobile ? "span 2" : "auto" }}>
              <div style={{ fontSize: 10, color: gananciaHoy >= 0 ? C.green : C.red, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Ganancia neta</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{formatARS(gananciaHoy)}</div>
            </div>
          </div>

          {/* Cierre */}
          <div style={S.section}>Cierre de caja</div>
          <button onClick={() => setCierreModal(true)} style={{ ...S.btnDanger, marginBottom: 16 }}>🔒 Hacer cierre de caja</button>

          {cierres.length > 0 && (() => {
            const ul = [...cierres].reverse()[0];
            return (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: C.vdim, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>Último cierre · {ul.turno} · {ul.fecha}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[["💵 En caja", formatARS(ul.efectivoNeto), C.green], ["📱 Transferencia", formatARS(ul.transferencia), C.blue], ["📊 Balance día", formatARS(ul.gananciaDia), ul.gananciaDia >= 0 ? C.green : C.red]].map(([l,v,c]) => (
                    <div key={l} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Google Forms -> Sheets */}
          <div style={S.section}>Google Sheets (vía Google Forms)</div>
          {editSheets ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 10 }}>Conectar con Google Forms</div>

              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
                1. Creá un Google Form con 11 preguntas de respuesta corta, una por cada dato:
              </div>
              <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 12, marginBottom: 10, maxHeight: 180, overflowY: "auto" }}>
                {CAMPOS_FORM.map(c => (
                  <div key={c.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, gap: 8 }}>
                    <span style={{ color: C.muted, flexShrink: 0 }}>{c.label}</span>
                    <code style={{ color: C.gold, fontSize: 10, textAlign: "right" }}>{MARKERS[c.key]}</code>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
                2. En cada pregunta del formulario, escribí como respuesta de prueba el código de la derecha (ej: en la pregunta "Fecha" escribí <code style={{ color: C.gold }}>MARCA_FECHA_01</code>).
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
                3. En los 3 puntitos del formulario tocá <b>"Obtener enlace para completar automáticamente"</b>, completá con esos códigos, generá el link y copialo.
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
                4. Pegá ese link acá:
              </div>

              <textarea value={linkTemp} onChange={e => { setLinkTemp(e.target.value); setLinkError(""); }} style={{ ...S.input, minHeight: 80, resize: "vertical", marginBottom: 8, fontFamily: "monospace", fontSize: 11 }} placeholder="https://docs.google.com/forms/d/e/.../viewform?usp=pp_url&entry.123=MARCA_FECHA_01&..." />

              {linkError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>{linkError}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditSheets(false); setLinkError(""); }} style={S.btnGhost}>Cancelar</button>
                <button onClick={() => {
                  const parsed = parseFormLink(linkTemp);
                  if (!parsed) return setLinkError("No pude leer ese link. Verificá que sea el link 'pre-llenado' completo.");
                  const faltantes = CAMPOS_FORM.filter(c => !parsed.entries[c.key]);
                  if (faltantes.length > 0) return setLinkError(`Faltan campos: ${faltantes.map(f => f.label).join(", ")}. Revisá que cada pregunta tenga su código exacto.`);
                  setFormConfig(parsed);
                  setEditSheets(false);
                  showOk("✓ Google Forms conectado");
                }} style={{ ...S.btnPrimary, flex: 2, padding: "12px 0" }}>Conectar</button>
              </div>
            </div>
          ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: formConfig ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, color: formConfig ? C.green : C.dim, fontWeight: formConfig ? 600 : 400 }}>{formConfig ? "✓ Conectado" : "Sin conectar"}</div>
                  {formConfig && <div style={{ fontSize: 11, color: C.vdim, marginTop: 2 }}>Los cierres se envían automáticamente al formulario</div>}
                </div>
                <button onClick={() => { setLinkTemp(""); setLinkError(""); setEditSheets(true); }} style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, color: C.dim, fontSize: 11, padding: "6px 12px", cursor: "pointer" }}>{formConfig ? "Reconfigurar" : "Configurar"}</button>
              </div>
              {formConfig && (
                <button onClick={async () => {
                  setSheetsSending(true);
                  try {
                    await enviarAForm({ fecha: today(), turno: "TEST", efectivo: 1111, transferencia: 2222, gastoEfectivo: 333, efectivoNeto: 778, totalVentasDia: 9999, totalGastosDia: 333, gananciaDia: 9666, semana: getWeekLabel(today()), peDiario: peDiario });
                    showOk("✓ Prueba enviada · revisá el formulario");
                  } catch { showErr("⚠ Error en la prueba"); }
                  setSheetsSending(false);
                }} disabled={sheetsSending} style={{ width: "100%", background: "none", border: `1px solid ${C.gold}44`, borderRadius: 8, color: C.gold, fontSize: 12, padding: "9px 0", cursor: "pointer", fontWeight: 600 }}>
                  {sheetsSending ? "Enviando prueba..." : "🧪 Enviar dato de prueba"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VENTAS ── */}
      {tab === "Ventas" && (
        <div style={{ padding: isMobile ? 16 : 28 }}>
          <div style={S.section}>Registrar venta</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={S.label}>Fecha</label><input type="date" value={venta.fecha} onChange={e => setVenta(v => ({...v, fecha: e.target.value}))} style={S.input} /></div>
            <div><label style={S.label}>Turno</label><select value={venta.turno} onChange={e => setVenta(v => ({...v, turno: e.target.value}))} style={S.input}>{TURNOS.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Producto</label>
            {productosDisponibles.length === 0 ? (
              <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: 14, fontSize: 13, color: C.dim, textAlign: "center" }}>Sin stock · cargá productos en la pestaña Stock</div>
            ) : (
              <select value={venta.producto} onChange={e => setVenta(v => ({...v, producto: e.target.value}))} style={S.input}>
                <option value="">Seleccioná un producto</option>
                {productosDisponibles.map(p => <option key={p} value={p}>{p} ({stockActual[p].cantidad} {stockActual[p].unidad})</option>)}
              </select>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Modalidad</label>
            <div style={{ display: "flex", gap: 6 }}>{MODALIDADES_VENTA.map(m => <button key={m} onClick={() => setVenta(v => ({...v, modalidad: m}))} style={S.chip(venta.modalidad === m, C.gold)}>{m}</button>)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={S.label}>Cantidad</label><input type="number" min="1" value={venta.cantidad} onChange={e => setVenta(v => ({...v, cantidad: e.target.value}))} style={S.input} /></div>
            <div><label style={S.label}>Precio {venta.modalidad === "Unidad" ? "x u." : venta.modalidad === "Media docena (6)" ? "x ½ doc." : "x doc."} $</label><input type="number" value={venta.precioUnidad} onChange={e => setVenta(v => ({...v, precioUnidad: e.target.value}))} style={S.input} placeholder="0" /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Método de pago</label>
            <div style={{ display: "flex", gap: 8 }}>{METODOS_PAGO.map(m => <button key={m} onClick={() => setVenta(v => ({...v, metodoPago: m}))} style={S.chip(venta.metodoPago === m, C.green)}>{m === "Efectivo" ? "💵 Efectivo" : "📱 Transferencia"}</button>)}</div>
          </div>
          {venta.precioUnidad && venta.cantidad && (
            <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 4 }}>Resumen</div>
              <div style={{ fontSize: 13, color: C.muted }}>{venta.cantidad} × {venta.modalidad} = {totalUV} unidades</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginTop: 4 }}>Total: {formatARS(totalVA)}</div>
            </div>
          )}
          <button onClick={agregarVenta} style={S.btnPrimary}>Registrar venta</button>

          <div style={{ marginTop: 32 }}>
            <div style={S.section}>Ventas de hoy</div>
            {ventasHoy.length === 0 ? <div style={{ color: C.vdim, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Sin ventas hoy</div>
            : ventasHoy.map(v => (
              <div key={v.id} style={S.row}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.producto} <span style={{ color: C.dim, fontWeight: 400, fontSize: 12 }}>· {v.modalidad} ×{v.cantidad}</span></div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{v.turno} · {v.metodoPago} · {v.unidadesDescontadas} u.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{formatARS(v.total)}</div>
                  <button onClick={() => setVentas(p => p.filter(x => x.id !== v.id))} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GASTOS ── */}
      {tab === "Gastos" && (
        <div style={{ padding: isMobile ? 16 : 28 }}>
          <div style={S.section}>Registrar gasto</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={S.label}>Fecha</label><input type="date" value={gasto.fecha} onChange={e => setGasto(g => ({...g, fecha: e.target.value}))} style={S.input} /></div>
            <div><label style={S.label}>Categoría</label><select value={gasto.categoria} onChange={e => setGasto(g => ({...g, categoria: e.target.value}))} style={S.input}>{CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={S.label}>Descripción</label><input type="text" value={gasto.descripcion} onChange={e => setGasto(g => ({...g, descripcion: e.target.value}))} style={S.input} placeholder="Ej: Alquiler junio, Harina 25kg" /></div>
          <div style={{ marginBottom: 12 }}><label style={S.label}>Monto $</label><input type="number" value={gasto.monto} onChange={e => setGasto(g => ({...g, monto: e.target.value}))} style={S.input} placeholder="0" /></div>

          {/* Toggle costo fijo */}
          <div style={{ background: C.surface2, border: `1px solid ${gasto.esFijo ? C.gold + "44" : C.border}`, borderRadius: 10, padding: "13px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: gasto.esFijo ? C.gold : C.muted, fontWeight: gasto.esFijo ? 700 : 400 }}>📌 Costo fijo mensual</div>
              <div style={{ fontSize: 11, color: C.vdim, marginTop: 2 }}>Suma al cálculo del punto de equilibrio</div>
            </div>
            <button onClick={() => setGasto(g => ({...g, esFijo: !g.esFijo}))} style={{ width: 46, height: 26, borderRadius: 13, border: "none", background: gasto.esFijo ? C.gold : "#333", cursor: "pointer", position: "relative", flexShrink: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: gasto.esFijo ? 23 : 3, transition: "left 0.2s" }} />
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Método de pago</label>
            <div style={{ display: "flex", gap: 8 }}>{METODOS_PAGO.map(m => <button key={m} onClick={() => setGasto(g => ({...g, metodoPago: m}))} style={S.chip(gasto.metodoPago === m, C.green)}>{m === "Efectivo" ? "💵 Efectivo" : "📱 Transferencia"}</button>)}</div>
          </div>
          <div style={{ marginBottom: gasto.estadoPago === "A crédito" ? 12 : 18 }}>
            <label style={S.label}>Estado</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Abonado","A crédito"].map(e => <button key={e} onClick={() => setGasto(g => ({...g, estadoPago: e}))} style={S.chip(gasto.estadoPago === e, e === "Abonado" ? C.green : C.red)}>{e === "Abonado" ? "✓ Abonado" : "📅 A crédito"}</button>)}
            </div>
          </div>
          {gasto.estadoPago === "A crédito" && (
            <div style={{ marginBottom: 18 }}><label style={S.label}>Fecha de vencimiento</label><input type="date" value={gasto.fechaVencimiento} onChange={e => setGasto(g => ({...g, fechaVencimiento: e.target.value}))} style={S.input} /></div>
          )}
          <button onClick={agregarGasto} style={S.btnPrimary}>Registrar gasto</button>

          {gastosFijos.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={S.section}>📌 Costos fijos del mes</div>
              {gastosFijos.map(g => (
                <div key={g.id} style={{ ...S.row, borderColor: C.gold + "33" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{g.descripcion}</div><div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{g.categoria} · {g.estadoPago}</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{formatARS(g.monto)}</div>
                    <button onClick={() => setGastos(p => p.filter(x => x.id !== g.id))} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 20 }}>×</button>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.dim }}>Total fijos · PE diario</span>
                <span style={{ fontWeight: 700, color: C.gold }}>{formatARS(totalFijos)} · {formatARS(peDiario)}/día</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <div style={S.section}>Gastos de hoy</div>
            {gastos.filter(g => g.fecha === today()).length === 0
              ? <div style={{ color: C.vdim, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Sin gastos hoy</div>
              : gastos.filter(g => g.fecha === today()).map(g => (
                <div key={g.id} style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.descripcion} {g.esFijo ? "📌" : ""}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{g.categoria} · {g.metodoPago} · <span style={{ color: g.estadoPago === "Abonado" ? C.green : C.red }}>{g.estadoPago}</span>{g.estadoPago === "A crédito" && g.fechaVencimiento ? ` · vence ${g.fechaVencimiento}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{formatARS(g.monto)}</div>
                    <button onClick={() => setGastos(p => p.filter(x => x.id !== g.id))} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 20 }}>×</button>
                  </div>
                </div>
              ))}
          </div>

          {gastosCredito.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={S.section}>Créditos pendientes</div>
              {gastosCredito.map(g => (
                <div key={g.id} style={{ ...S.row, borderColor: g.fechaVencimiento && g.fechaVencimiento < today() ? C.red + "55" : C.border }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{g.descripcion}</div><div style={{ fontSize: 11, color: g.fechaVencimiento && g.fechaVencimiento < today() ? C.red : C.dim, marginTop: 3 }}>{g.fecha} · vence {g.fechaVencimiento || "sin fecha"}{g.fechaVencimiento && g.fechaVencimiento < today() ? " ⚠️ VENCIDO" : ""}</div></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{formatARS(g.monto)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STOCK ── */}
      {tab === "Stock" && (
        <div style={{ padding: isMobile ? 16 : 28 }}>
          <div style={S.section}>Movimiento de stock</div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Tipo</label>
            <div style={{ display: "flex", gap: 8 }}>{["entrada","salida"].map(t => <button key={t} onClick={() => setStockItem(s => ({...s, tipo: t}))} style={S.chip(stockItem.tipo === t, t === "entrada" ? C.green : C.red)}>{t === "entrada" ? "📦 Entrada" : "📤 Salida"}</button>)}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Producto / Insumo</label>
            <input type="text" value={stockItem.nombre} onChange={e => setStockItem(s => ({...s, nombre: e.target.value}))} style={S.input} placeholder="Ej: Medialuna, Cookie Chocolate" list="pl" />
            <datalist id="pl">{Object.keys(stockActual).map(p => <option key={p} value={p} />)}</datalist>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={S.label}>Cantidad</label><input type="number" value={stockItem.cantidad} onChange={e => setStockItem(s => ({...s, cantidad: e.target.value}))} style={S.input} placeholder="0" /></div>
            <div><label style={S.label}>Unidad</label><select value={stockItem.unidad} onChange={e => setStockItem(s => ({...s, unidad: e.target.value}))} style={S.input}>{["unidades","kg","gr","litros","bolsas","porciones","docenas"].map(u => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 18 }}><label style={S.label}>Fecha</label><input type="date" value={stockItem.fecha} onChange={e => setStockItem(s => ({...s, fecha: e.target.value}))} style={S.input} /></div>
          <button onClick={agregarStock} style={S.btnPrimary}>Registrar movimiento</button>

          <div style={{ marginTop: 32 }}>
            <div style={S.section}>Stock actual</div>
            {Object.keys(stockActual).length === 0
              ? <div style={{ color: C.vdim, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Sin stock cargado aún</div>
              : <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 10 }}>
                  {Object.entries(stockActual).map(([nombre, data]) => (
                    <div key={nombre} style={{ background: C.surface2, border: `1px solid ${data.cantidad <= 0 ? C.red + "44" : data.cantidad <= 5 ? C.gold + "44" : C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>{nombre}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: data.cantidad <= 0 ? C.red : data.cantidad <= 5 ? C.gold : C.green }}>{data.cantidad}</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{data.unidad}</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── RESUMEN ── */}
      {tab === "Resumen" && (
        <div style={{ padding: isMobile ? 16 : 28 }}>
          <div style={{ marginBottom: 20 }}><label style={S.label}>Ver resumen del día</label><input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} style={S.input} /></div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
            <div style={S.card(C.greenDim, C.green)}><div style={{ fontSize: 10, color: C.green, textTransform: "uppercase", marginBottom: 4 }}>Ventas</div><div style={{ fontSize: 22, fontWeight: 800 }}>{formatARS(totalVD)}</div></div>
            <div style={S.card(C.redDim, C.red)}><div style={{ fontSize: 10, color: C.red, textTransform: "uppercase", marginBottom: 4 }}>Gastos</div><div style={{ fontSize: 22, fontWeight: 800 }}>{formatARS(totalGD)}</div></div>
            <div style={{ ...S.card(ganDia >= 0 ? C.greenDim : C.redDim, ganDia >= 0 ? C.green : C.red), gridColumn: isMobile ? "span 2" : "auto" }}><div style={{ fontSize: 10, color: ganDia >= 0 ? C.green : C.red, textTransform: "uppercase", marginBottom: 4 }}>Ganancia</div><div style={{ fontSize: 24, fontWeight: 800 }}>{formatARS(ganDia)}</div></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {METODOS_PAGO.map(mp => (
              <div key={mp} style={S.card(C.surface, "#555")}>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>{mp === "Efectivo" ? "💵" : "📱"} {mp}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatARS(ventasDia.filter(v => v.metodoPago === mp).reduce((a,b) => a+b.total, 0))}</div>
              </div>
            ))}
          </div>

          {TURNOS.map(turno => {
            const tv = ventasDia.filter(v => v.turno === turno);
            if (!tv.length) return null;
            return (
              <div key={turno} style={{ marginBottom: 20 }}>
                <div style={S.section}>Turno {turno}</div>
                {tv.map(v => (
                  <div key={v.id} style={S.row}>
                    <div><div style={{ fontSize: 13 }}>{v.producto} · {v.modalidad} ×{v.cantidad}</div><div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{v.metodoPago} · {v.unidadesDescontadas} u.</div></div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formatARS(v.total)}</div>
                  </div>
                ))}
              </div>
            );
          })}

          {Object.keys(gastosCat).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={S.section}>Gastos por categoría</div>
              {Object.entries(gastosCat).map(([cat, total]) => (
                <div key={cat} style={{ ...S.row, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>{cat}</span>
                  <span style={{ fontWeight: 700, color: C.red }}>{formatARS(total)}</span>
                </div>
              ))}
            </div>
          )}

          {cierres.length > 0 && (
            <div>
              <div style={S.section}>Historial de cierres</div>
              {[...cierres].reverse().slice(0, 10).map(c => (
                <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.fecha} · {c.turno}</span>
                    <span style={{ fontSize: 11, color: C.vdim }}>{getWeekLabel(c.fecha)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[["💵 Caja", formatARS(c.efectivoNeto), C.green], ["📱 Transfer.", formatARS(c.transferencia), C.blue], ["📊 Balance", formatARS(c.gananciaDia), c.gananciaDia >= 0 ? C.green : C.red]].map(([l,v,col]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.dim }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: col, marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {ventasDia.length === 0 && gastosDia.length === 0 && (
            <div style={{ color: C.vdim, fontSize: 13, textAlign: "center", padding: "40px 0" }}>Sin movimientos para este día</div>
          )}
        </div>
      )}

      {/* ── CONFIGURACIÓN ── */}
      {tab === "Configuración" && (
        <div style={{ padding: isMobile ? 16 : 28 }}>
          <div style={S.section}>Días y horarios de atención</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
            Marcá qué días abre el local y el horario de cada uno. Esto se usa para calcular los días hábiles del mes y el punto de equilibrio diario.
          </div>

          {DIAS_SEMANA.map((nombre, idx) => {
            const cfg = horarios[idx];
            const esHoy = new Date().getDay() === idx;
            return (
              <div key={idx} style={{ background: C.surface, border: `1px solid ${esHoy ? C.gold + "44" : C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cfg.abierto ? 10 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: cfg.abierto ? C.text : C.dim }}>
                    {nombre} {esHoy && <span style={{ fontSize: 10, color: C.gold }}>· hoy</span>}
                  </div>
                  <button
                    onClick={() => setHorarios(h => h.map((d, i) => i === idx ? { ...d, abierto: !d.abierto, texto: !d.abierto && !d.texto ? "8:00 – 13:00" : d.texto } : d))}
                    style={{ width: 46, height: 26, borderRadius: 13, border: "none", background: cfg.abierto ? C.green : "#333", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: cfg.abierto ? 23 : 3, transition: "left 0.2s" }} />
                  </button>
                </div>
                {cfg.abierto && (
                  <input
                    type="text"
                    value={cfg.texto}
                    onChange={e => setHorarios(h => h.map((d, i) => i === idx ? { ...d, texto: e.target.value } : d))}
                    style={S.input}
                    placeholder="Ej: 7:30 – 13:00 / 16:00 – 21:00"
                  />
                )}
                {!cfg.abierto && <div style={{ fontSize: 12, color: C.vdim }}>Cerrado</div>}
              </div>
            );
          })}

          <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "12px 16px", marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.dim }}>
              <span>Días hábiles este mes</span>
              <span style={{ color: C.gold, fontWeight: 700 }}>{diasHabiles}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Modal cierre
  const modalCierre = cierreModal && (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 998, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1a1a", borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: 28, width: "100%", maxWidth: 440, margin: isMobile ? "0" : "0 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Cierre de caja</div>
        <div style={{ marginBottom: 18 }}>
          <label style={S.label}>Turno a cerrar</label>
          <div style={{ display: "flex", gap: 8 }}>{TURNOS.map(t => <button key={t} onClick={() => setCierreTurno(t)} style={S.chip(cierreTurno === t, C.gold)}>{t}</button>)}</div>
        </div>
        {(() => {
          const vt = ventas.filter(v => v.fecha === today() && v.turno === cierreTurno);
          const ef = vt.filter(v => v.metodoPago === "Efectivo").reduce((a,b) => a+b.total, 0);
          const tr = vt.filter(v => v.metodoPago === "Transferencia").reduce((a,b) => a+b.total, 0);
          const ge = gastos.filter(g => g.fecha === today() && g.metodoPago === "Efectivo" && g.estadoPago === "Abonado").reduce((a,b) => a+b.monto, 0);
          return (
            <div style={{ background: "#111", borderRadius: 12, padding: 18, marginBottom: 20 }}>
              {[["💵 Efectivo cobrado", formatARS(ef), C.green], ["📱 Transferencias", formatARS(tr), C.blue], ["💸 Gastos en efectivo", `-${formatARS(ge)}`, C.red]].map(([l,v,c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>{l}</span>
                  <span style={{ fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border2}`, paddingTop: 12 }}>
                <span style={{ color: C.gold, fontSize: 15, fontWeight: 700 }}>💰 Efectivo en caja</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: C.gold }}>{formatARS(ef - ge)}</span>
              </div>
              {formConfig && <div style={{ marginTop: 12, fontSize: 11, color: C.vdim, textAlign: "center" }}>Se enviará al Google Sheets</div>}
            </div>
          );
        })()}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setCierreModal(false)} style={S.btnGhost}>Cancelar</button>
          <button onClick={hacerCierre} disabled={sheetsSending} style={{ flex: 2, ...S.btnPrimary, padding: "13px 0", opacity: sheetsSending ? 0.6 : 1 }}>{sheetsSending ? "Enviando..." : "Confirmar cierre"}</button>
        </div>
      </div>
    </div>
  );

  // ── RENDER MOBILE ─────────────────────────────────────────
  if (isMobile) return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {ok && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: C.gold, color: "#0f0f0f", padding: "10px 24px", borderRadius: 20, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap", boxShadow: `0 4px 20px ${C.gold}44` }}>{ok}</div>}
      {err && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#7a2020", color: C.text, padding: "10px 24px", borderRadius: 20, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap" }}>{err}</div>}
      {modalCierre}

      {/* Header mobile */}
      <div style={{ background: "linear-gradient(135deg,#1a1a1a 0%,#2a1f0e 100%)", padding: "20px 16px 14px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: C.gold + "88", textTransform: "uppercase", marginBottom: 3 }}>Panel de gestión</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Los Brodis</div>
          <div style={{ fontSize: 11, color: C.dim }}>{getDayName()} · {getHorario(horarios) || "Cerrado"}</div>
        </div>
      </div>

      {content}

      {/* Bottom nav mobile */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 10, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 0 12px", border: "none", background: "none", color: tab === t.id ? C.gold : C.dim, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── RENDER DESKTOP ────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", display: "flex" }}>
      {ok && <div style={{ position: "fixed", top: 24, right: 24, background: C.gold, color: "#0f0f0f", padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: `0 4px 20px ${C.gold}44` }}>{ok}</div>}
      {err && <div style={{ position: "fixed", top: 24, right: 24, background: "#7a2020", color: C.text, padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 999 }}>{err}</div>}
      {modalCierre}

      {/* Sidebar desktop */}
      <div style={{ width: 220, background: "#111", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: "28px 20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.gold + "88", textTransform: "uppercase", marginBottom: 6 }}>Panel de gestión</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>Los Brodis</div>
          <div style={{ fontSize: 11, color: C.dim }}>{getDayName()}</div>
          <div style={{ fontSize: 11, color: C.dim }}>{getHorario(horarios) || "Cerrado hoy"}</div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "none", borderRadius: 10, background: tab === t.id ? C.gold + "18" : "none", color: tab === t.id ? C.gold : C.dim, fontWeight: tab === t.id ? 700 : 400, fontSize: 14, cursor: "pointer", marginBottom: 4, textAlign: "left", transition: "all 0.15s" }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Mini resumen sidebar */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.vdim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Hoy</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.dim }}>Ventas</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{formatARS(totalHoy)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.dim }}>Gastos</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{formatARS(gastosHoy)}</span>
          </div>
          {peDiario > 0 && (
            <>
              <div style={{ background: "#1e1e1e", borderRadius: 99, height: 4, overflow: "hidden", marginBottom: 4 }}>
                <div style={{ width: `${pct}%`, background: barColor, height: "100%", borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 10, color: C.dim, textAlign: "right" }}>PE: {pct.toFixed(0)}%</div>
            </>
          )}
        </div>
      </div>

      {/* Main content desktop */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Topbar desktop */}
        <div style={{ background: "linear-gradient(135deg,#1a1a1a 0%,#2a1f0e 100%)", padding: "18px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{TABS.find(t => t.id === tab)?.label}</div>
          <div style={{ fontSize: 12, color: C.dim }}>{new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <div style={{ flex: 1, maxWidth: 860, width: "100%" }}>
          {content}
        </div>
      </div>
    </div>
  );
}
