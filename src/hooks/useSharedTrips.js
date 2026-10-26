import { useCallback, useEffect, useRef, useState } from "react";
import * as liveApi from "../lib/sharedTrips";
import { validateTrips } from "../lib/tripLedger";
export default function useSharedTrips(user, api = liveApi, scope = "shared") {
  const [trips, setTrips] = useState([]),
    [active, setActive] = useState(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const current = useRef([]),
    mutating = useRef(false),
    epoch = useRef(0),
    mounted = useRef(true);
  const assign = useCallback((data) => {
    if (!mounted.current) return;
    current.current = data;
    setTrips(data);
    setActive((id) =>
      data.some((t) => t.id === id) ? id : data[0]?.id || null,
    );
  }, []);
  const refresh = useCallback(
    async (force = false) => {
      if (mutating.current && !force) return;
      const request = ++epoch.current;
      try {
        const all = await api.listSharedTrips();
        const data = all.filter(trip => (trip.scope || "shared") === scope);
        if (mounted.current && request === epoch.current) { assign(data); setError(""); }
      } catch (e) {
        if (mounted.current && request === epoch.current) setError(e.message);
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [api, assign, scope],
  );
  useEffect(() => {
    mounted.current = true;
    refresh();
    const update = () => {
      if (!document.hidden) refresh();
    };
    const timer = setInterval(update, 8000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      mounted.current = false;
      epoch.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [refresh, user.id]);
  const persist = async (next) => {
    if (mutating.current) return false;
    mutating.current = true;
    epoch.current++;
    setSaving(true);
    setError("");
    try {
      validateTrips(next);
      let confirmed = [...current.current];
      for (const trip of next) {
        const old = current.current.find((t) => t.id === trip.id);
        if (!old) {
          const self = trip.people.find(
            (p) =>
              p.name.toLocaleLowerCase() ===
              api.profileName(user).toLocaleLowerCase(),
          )?.id;
          const created = await api.createSharedTrip(trip, self || null);
          if (created.people) confirmed = [created, ...confirmed];
        } else if (
          JSON.stringify(api.ledgerData(old)) !==
          JSON.stringify(api.ledgerData(trip))
        ) {
          await api.saveSharedTrip(trip);
          confirmed = confirmed.map((old) =>
            old.id === trip.id ? { ...trip, version: trip.version + 1 } : old,
          );
        }
      }
      assign(confirmed);
      await refresh(true);
      return true;
    } catch (e) {
      await refresh(true);
      if (mounted.current) setError(e.message);
      return false;
    } finally {
      mutating.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  async function leave(id) {
    if (mutating.current) return false;
    mutating.current = true;
    epoch.current++;
    setSaving(true);
    setError("");
    try {
      await api.tripRpc("rr_leave_trip", { p_trip: id });
      assign(current.current.filter((t) => t.id !== id));
      await refresh(true);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      mutating.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return {
    trips,
    active,
    setActive,
    loading,
    saving,
    error,
    setError,
    persist,
    refresh,
    leave,
  };
}
