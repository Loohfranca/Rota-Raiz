import React, { useState } from "react";
import { Users, UserRound } from "lucide-react";
import TripView from "./TripView";
export default function AccountsView({ user, inviteToken, onInviteHandled, api }) {
  const [scope, setScope] = useState(inviteToken ? "shared" : "individual");
  return <div className="accounts-page">
    <header className="accounts-heading"><p className="eyebrow">GASTOS DA VIAGEM</p><h1>Na conta</h1><p>Do seu café à passagem de avião. Cada gasto no lugar certo.</p></header>
    <div className="finance-tabs" role="group" aria-label="Tipo de gastos">
      <button aria-pressed={scope === "individual"} onClick={() => setScope("individual")}><UserRound size={18} />Individual<small>Só você tem acesso</small></button>
      <button aria-pressed={scope === "shared"} onClick={() => setScope("shared")}><Users size={18} />Compartilhado<small>Contas do casal ou grupo</small></button>
    </div>
    <TripView key={`${user.id}:${scope}`} user={user} scope={scope} api={api} inviteToken={scope === "shared" ? inviteToken : null} onInviteHandled={onInviteHandled} />
  </div>;
}
