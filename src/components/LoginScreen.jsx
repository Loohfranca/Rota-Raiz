import React, { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function LoginScreen({ loading = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err?.message || "Não foi possível entrar com Google. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <main className="rr-login-screen" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--surface, #f7f5ee)", padding: "28px 18px" }}>
      <section className="rr-login-card" aria-label="Entrar no Rota Raiz" style={{ width: "100%", maxWidth: 420, padding: "40px 28px", background: "var(--surface-container-lowest, #fffefa)", border: "1px solid var(--border-color, #d9ded2)", borderRadius: 28, boxShadow: "0 20px 65px rgba(36,62,50,.08)", textAlign: "center" }}>
        <div className="rr-login-brand" aria-label="Rota Raiz — o caminho também é viagem">
          <img className="rr-login-logo rr-login-logo-light" src="/rota-logo.svg" alt="Rota Raiz" width="190" height="180"/>
          <img className="rr-login-logo rr-login-logo-dark" src="/rota-logo-dark.svg" alt="" aria-hidden="true" width="190" height="180"/>
          <p>o caminho também é viagem</p>
        </div>
        <h1 style={{ fontSize: 26, lineHeight: 1.2, margin: "0 0 12px", color: "var(--on-surface, #243e32)" }}>Sua próxima viagem começa aqui.</h1>
        <p style={{ color: "var(--on-surface-variant, #596458)", margin: "0 0 30px", lineHeight: 1.6 }}>Descubra lugares, organize suas viagens e compartilhe os melhores caminhos.</p>
        {loading ? (
          <p role="status">Verificando sua sessão…</p>
        ) : !supabase ? (
          <p role="alert" style={{ color: "#a64425" }}>Login indisponível: configure a URL e a chave pública do Supabase neste ambiente.</p>
        ) : (
          <button type="button" disabled={busy} onClick={handleGoogleLogin} style={{ width: "100%", minHeight: 54, padding: "12px 16px", borderRadius: 15, background: "var(--secondary, #243e32)", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 11 }}>
            <svg viewBox="0 0 48 48" width="23" height="23" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.8 7.18l7.73 6C44.38 38.03 46.98 31.89 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {busy ? "Abrindo Google…" : "Continuar com Google"} <ArrowRight size={18} />
          </button>
        )}
        {error && <p role="alert" style={{ color: "#a64425", fontSize: 13, marginTop: 14 }}>{error}</p>}
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--on-surface-variant, #596458)", margin: "24px 0 0" }}><ShieldCheck size={15} /> Login seguro com sua conta Google</p>
      </section>
    </main>
  );
}
