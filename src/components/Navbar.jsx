import React from "react";
import { Compass, WifiOff, Leaf } from "lucide-react";
import PhotoCredits from "./PhotoCredits";
import { TABS } from "./BottomNav";
export default function Navbar({ activeTab, onChangeTab, isOnline }) {
  return (
    <header className="app-header">
      <div className="nav-shell">
        <button
          className="brand"
          onClick={() => onChangeTab("tours")}
          aria-label="Rota Raiz — explorar passeios"
        >
          <span className="brand-mark">
            <Compass size={24} />
          </span>
          <span>
            rota<span className="brand-light">raiz</span>
            <small>o caminho também é viagem</small>
          </span>
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChangeTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="nav-status-actions"><PhotoCredits/>
        <span
          className={`connection-status ${!isOnline ? "is-offline" : ""}`}
          role="status"
        >
          {isOnline ? <Leaf size={16} /> : <WifiOff size={16} />}
          <span>{isOnline ? "Vá no seu ritmo" : "Sem conexão"}</span>
        </span></div>
      </div>
    </header>
  );
}
