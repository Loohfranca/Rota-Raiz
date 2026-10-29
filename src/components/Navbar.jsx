import React from "react";
import { Compass, WifiOff, Leaf, LogOut, Sun, Moon } from "lucide-react";
import PhotoCredits from "./PhotoCredits";
import { TABS } from "./BottomNav";
export default function Navbar({ activeTab, onChangeTab, isOnline, user, onSignOut, theme, onThemeChange }) {
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
        <button className="theme-toggle" type="button" onClick={onThemeChange} aria-label={theme==="dark"?"Ativar tema claro":"Ativar tema escuro"} title={theme==="dark"?"Tema claro":"Tema escuro"} aria-pressed={theme==="dark"}>{theme==="dark"?<Sun size={19}/>:<Moon size={19}/>}<span>{theme==="dark"?"Claro":"Escuro"}</span></button>
        {user && (
          <button
            type="button"
            onClick={onSignOut}
            className="account-signout"
            title={`Sair da conta de ${user.user_metadata?.full_name || user.email || "usuário"}`}
            aria-label="Sair da conta"
          >
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                className="account-avatar"
              />
            ) : <LogOut size={18} />}
            <span>Sair</span>
          </button>
        )}
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
