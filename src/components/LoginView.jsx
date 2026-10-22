import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader } from 'lucide-react';
import { signInWithGoogle } from '../lib/supabase';

export default function LoginView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error: loginError } = await signInWithGoogle();
    if (loginError) {
      setError(loginError);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 bg-[#f4ede0]">
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#c2461f] flex items-center justify-center">
            <span className="text-2xl font-bold text-white">🗺️</span>
          </div>
          <h1 className="font-headline font-bold text-3xl text-[#201b15]">
            Rota Raiz
          </h1>
          <p className="text-sm text-[#59413b] max-w-xs">
            Descubra rotas econômicas, organize viagens e compartilhe gastos com amigos.
          </p>
        </div>

        {/* Features Preview */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
            <span className="text-lg shrink-0">🚐</span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold text-[#201b15]">Rotas de Van e Ônibus</span>
              <span className="text-xs text-[#59413b]">Encontre a melhor rota econômica</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
            <span className="text-lg shrink-0">🏖️</span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold text-[#201b15]">Passeios Raiz</span>
              <span className="text-xs text-[#59413b]">Praias e atrativos perto de você</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
            <span className="text-lg shrink-0">💰</span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold text-[#201b15]">Dividir Gastos</span>
              <span className="text-xs text-[#59413b]">Organize despesas de grupo</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-red-900">Erro ao fazer login</span>
              <span className="text-xs text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full min-h-[52px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] disabled:opacity-60 text-white flex items-center justify-center gap-2.5 font-bold transition-colors shadow-sm"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>Entrar com Google</span>
            </>
          )}
        </button>

        {/* Privacy Notice */}
        <p className="text-xs text-[#59413b] text-center leading-relaxed">
          Ao fazer login, você concorda com nossos termos e aceita que seus dados sejam usados para sincronizar suas rotas salvas e viagens compartilhadas.
        </p>
      </div>
    </div>
  );
}
