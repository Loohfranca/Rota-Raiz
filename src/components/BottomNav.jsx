import React from "react";
import { Navigation, Wallet, Users, Compass, Route } from "lucide-react";
export const TABS = [
  { id: "tours", label: "Explorar", icon: Compass },
  { id: "routes", label: "Como chegar", icon: Navigation },
  { id: "itinerary", label: "Minhas viagens", mobileLabel: "Viagens", icon: Route },
  { id: "community", label: "Comunidade", icon: Users },
  { id: "trip", label: "Na conta", icon: Wallet },
];
export default function BottomNav({ activeTab, onChangeTab }) {
  return (
    <nav className="mobile-nav" aria-label="Navegação no celular">
      {TABS.map(({ id, label, mobileLabel, icon: Icon }) => (
        <button
          key={id}
          aria-label={label}
          onClick={() => onChangeTab(id)}
          aria-current={activeTab === id ? "page" : undefined}
        >
          <Icon size={21} />
          <span>{mobileLabel || label}</span>
        </button>
      ))}
    </nav>
  );
}
