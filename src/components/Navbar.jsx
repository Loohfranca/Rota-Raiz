import React from "react";
import { Compass, WifiOff, Leaf, LogOut } from "lucide-react";
import PhotoCredits from "./PhotoCredits";
import { TABS } from "./BottomNav";
export default function Navbar({ activeTab, onChangeTab, isOnline, user, onSignOut }) {
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
        {user && <button type="button" onClick={onSignOut} title={`Sair da conta de ${user.user_metadata?.full_name || user.email || "usuário"}`} aria-label="Sair da conta" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:44, minHeight:44, borderRadius:"50%", border:"1px solid var(--border-color)", background:"var(--surface-container-lowest)", overflow:"hidden" }}>
          {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" style={{ width:36,height:36,borderRadius:"50%",objectFit:"cover" }} /> : <LogOut size={19}/>}
        </button>}
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
