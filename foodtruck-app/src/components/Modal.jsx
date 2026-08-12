import { useEffect } from 'react';
import { IconCerrar } from './icons.jsx';

// Modal tipo "bottom sheet": ocupa el ancho completo y sube desde abajo,
// más cómodo para usar con una mano en celular que un modal centrado.
export default function Modal({ titulo, onClose, children, footer }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet__header">
          <h2>{titulo}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <IconCerrar width={22} height={22} />
          </button>
        </div>
        <div className="modal-sheet__body">{children}</div>
        {footer && <div className="modal-sheet__footer">{footer}</div>}
      </div>
    </div>
  );
}
