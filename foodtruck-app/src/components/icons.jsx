// Set mínimo de íconos en SVG inline (sin librerías) para mantener el
// bundle liviano — importa cuando la app se empaqueta como APK.

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconInicio(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IconVender(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18" />
      <path d="M6 6V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
      <path d="M4 6l1.2 13.2A2 2 0 0 0 7.2 21h9.6a2 2 0 0 0 2-1.8L20 6" />
      <path d="M9 11h6" />
    </svg>
  );
}

export function IconCatalogo(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

export function IconClientes(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17.5" cy="9" r="2.6" />
      <path d="M15.8 12.2a5.4 5.4 0 0 1 5.7 5.4" />
    </svg>
  );
}

export function IconMas(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconVolver(props) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function IconMas2(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconCerrar(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function IconAlerta(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.2" fill="currentColor" />
    </svg>
  );
}

export function IconInsumos(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10h16l-1.5 9.2a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 10Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

export function IconGastos(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9" />
      <path d="M9.3 15c0 1.1 1.1 2 2.7 2s2.7-.8 2.7-2-1.1-1.6-2.7-2-2.7-.9-2.7-2 1.1-2 2.7-2 2.7.8 2.7 1.8" />
    </svg>
  );
}

export function IconTareas(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="2" />
      <path d="M8 10.5l2 2 4-4.5" />
      <path d="M8 16h6" />
    </svg>
  );
}
