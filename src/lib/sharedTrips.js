import { supabase } from "./supabase";
import { validateTrips } from "./tripLedger";
export const profileName = (user) => {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name;
  return typeof name === "string" && name.trim()
    ? name.trim().slice(0, 60)
    : "Viajante";
};
export function ledgerData(trip) {
  const { id, name, people, expenses } = trip;
  return { id, name, people, expenses };
}
export async function tripRpc(name, args = {}) {
  if (!supabase)
    throw new Error("A conexão das viagens compartilhadas está indisponível.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    if (["PGRST202", "PGRST205", "42P01", "42883"].includes(error.code))
      throw new Error(
        "As viagens compartilhadas precisam ser ativadas no banco. Seus dados anteriores continuam neste aparelho.",
      );
    throw new Error(
      error.code === "42501"
        ? "Sua conta não tem acesso a esta viagem."
        : error.message || "Não foi possível sincronizar. Tente novamente.",
    );
  }
  return data;
}
export async function listSharedTrips() {
  const data = await tripRpc("rr_list_trips");
  return validateTrips(data || []);
}
export async function saveSharedTrip(trip) {
  validateTrips([trip]);
  await tripRpc("rr_save_trip", {
    p_id: trip.id,
    p_version: trip.version,
    p: ledgerData(trip),
  });
}
export async function createSharedTrip(trip, selfPerson = null) {
  validateTrips([trip]);
  return tripRpc("rr_create_trip", {
    p: ledgerData(trip),
    p_self_person: selfPerson,
  });
}
export function inviteUrl(token) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.hash = "join=" + token;
  return url.href;
}
export function captureInvite() {
  try {
    const hash = window.location.hash;
    if (/^#join=[a-f0-9]{64}$/.test(hash)) {
      const token = hash.slice(6);
      sessionStorage.setItem("rotaraiz_pending_invite", token);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      return token;
    }
    const saved = sessionStorage.getItem("rotaraiz_pending_invite");
    return /^[a-f0-9]{64}$/.test(saved || "") ? saved : null;
  } catch {
    return null;
  }
}
export function clearInvite() {
  try {
    sessionStorage.removeItem("rotaraiz_pending_invite");
  } catch {
    /* memory state is cleared by App */
  }
}
