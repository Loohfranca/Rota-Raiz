import React, { useId, useState } from "react";

// Local suggestions only: typing never calls a geocoder or paid Places API.
export default function LocalAutocomplete({ label, value, onChange, items, onSelect, placeholder, onCancel, showOnFocus = true }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const visible = open && (showOnFocus || value.trim().length >= 2);
  const choose = item => { onSelect(item); setOpen(false); setActive(-1); };
  return <div className="local-autocomplete" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); onCancel?.(); }
  }}>
    <input aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={visible && items.length > 0} aria-controls={`${id}-list`} aria-activedescendant={visible && active >= 0 && items[active] ? `${id}-${active}` : undefined}
      value={value} placeholder={placeholder} autoComplete="off" maxLength={160}
      onFocus={() => setOpen(true)}
      onChange={event => {onChange(event.target.value); setOpen(true); setActive(-1);}}
      onKeyDown={event => {
        if (event.key === "ArrowDown" && items.length) {event.preventDefault(); setOpen(true); setActive(index => (index + 1) % items.length);}
        if (event.key === "ArrowUp" && items.length) {event.preventDefault(); setOpen(true); setActive(index => (index <= 0 ? items.length - 1 : index - 1));}
        if (event.key === "Enter" && visible && items.length) {event.preventDefault(); choose(items[active] || items[0]);}
        if (event.key === "Escape") {event.preventDefault(); setOpen(false); setActive(-1); onCancel?.();}
      }}/>
    {visible && items.length > 0 && <ul id={`${id}-list`} role="listbox" aria-label={`Sugestões de ${label}`}>
      {items.map((item,index) => <li key={item.id} role="presentation"><button type="button" role="option" id={`${id}-${index}`} aria-selected={active === index} onPointerDown={event => event.preventDefault()} onClick={() => choose(item)}>
        <strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}
      </button></li>)}
    </ul>}
  </div>;
}
