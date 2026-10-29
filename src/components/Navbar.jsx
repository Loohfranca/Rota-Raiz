import React from "react";
import { Compass, WifiOff, Leaf, LogOut, Sun, Moon, ShieldCheck, UserRound, ChevronDown } from "lucide-react";
import PhotoCredits from "./PhotoCredits";
import { TABS } from "./BottomNav";
export default function Navbar({ activeTab, onChangeTab, isOnline, user, onSignOut, theme, onThemeChange, isAdmin, onOpenAdmin, adminAlerts=0, onOpenProfile }) {
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
        {isAdmin&&<button className="rr-admin-entry" type="button" onClick={onOpenAdmin} title="Painel administrativo" aria-label="Abrir Central Administrativa" aria-current={activeTab==="admin"?"page":undefined}><ShieldCheck size={18}/><span>Admin</span>{adminAlerts>0&&<b aria-label={`${adminAlerts} ocorrência(s) para acompanhar`}>{adminAlerts>99?"99+":adminAlerts}</b>}</button>}
        <button className="theme-toggle rr-theme-icon-only" type="button" onClick={onThemeChange} aria-label={theme==="dark"?"Ativar tema claro":"Ativar tema escuro"} title={theme==="dark"?"Tema claro":"Tema escuro"} aria-pressed={theme==="dark"}>{theme==="dark"?<Sun size={17} strokeWidth={1.7}/>:<Moon size={17} strokeWidth={1.7}/>}</button>
        {user && (
          <details className="rr-account-menu">
            <summary aria-label="Abrir opções da conta">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" className="account-avatar"/>
                : <UserRound size={20}/>}
              <span>Minha conta</span>
              <ChevronDown size={16} className="rr-account-chevron"/>
            </summary>
            <div className="rr-account-dropdown">
              <div className="rr-account-dropdown-user">
                <strong>{user.user_metadata?.full_name||user.user_metadata?.name||"Viajante"}</strong>
                <small>{user.email}</small>
              </div>
              <button type="button" onClick={event=>{event.currentTarget.closest("details").open=false;onOpenProfile?.();}}>
                <UserRound size={17}/> Meu perfil
              </button>
              <button type="button" className="rr-account-logout" onClick={event=>{event.currentTarget.closest("details").open=false;onSignOut?.();}}>
                <LogOut size={17}/> Sair da conta
              </button>
            </div>
          </details>
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
