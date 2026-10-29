import React, { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import LoginWorldMap from "./LoginWorldMap";

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
    <main className="rr-login-screen">
      <LoginWorldMap />
      <section className="rr-login-card" aria-label="Entrar no Rota Raiz">
        <div className="rr-login-top">
          <div className="rr-login-brand" aria-label="Rota Raiz — o caminho também é viagem">
            <img src="/rota-logo.svg" alt="Rota Raiz" width="110" height="100"/>
            <span>o caminho também é viagem</span>
          </div>
          <div className="rr-login-copy">
            <h1>Sua próxima viagem começa aqui.</h1>
            <p>Descubra lugares e novos caminhos.</p>
          </div>
        </div>
        {loading ? (
          <p className="rr-login-loading" role="status">Verificando sua sessão…</p>
        ) : !supabase ? (
          <p className="rr-login-error" role="alert">Login indisponível: configure a URL e a chave pública do Supabase neste ambiente.</p>
        ) : (
          <button type="button" className="rr-login-google" disabled={busy} onClick={handleGoogleLogin}>
            <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.8 7.18l7.73 6C44.38 38.03 46.98 31.89 46.98 24.55z"/>
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>{busy ? "Abrindo Google…" : "Continuar com Google"}</span>
            <ArrowRight size={18} aria-hidden="true"/>
          </button>
        )}
        {error && <p role="alert" className="rr-login-error">{error}</p>}
        <p className="rr-login-secure"><ShieldCheck size={14} aria-hidden="true"/> Login seguro com sua conta Google</p>
      </section>
    </main>
  );
}
