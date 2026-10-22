import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Sheet({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog.close(); document.body.style.overflow = previous; }; }, []);
  return <dialog ref={ref} className={`raiz-sheet ${className}`} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="sheet-title"><header><h2 id="sheet-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={21}/></button></header><div className="sheet-body">{children}</div></dialog>;
}
