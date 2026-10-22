import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, RefreshCw, AlertCircle, X, FileCode } from 'lucide-react';
import {
  updateSupabaseConnection,
  isSupabaseConfigured,
  SUPABASE_SQL_SCHEMA
} from '../lib/supabase';

export default function SupabaseModal({ isOpen, onClose }) {
  const isConnected = isSupabaseConfigured();

  const savedConfig = localStorage.getItem('rotaraiz_supabase_config');
  const parsed = savedConfig ? JSON.parse(savedConfig) : {};

  const [url, setUrl] = useState(parsed.url || import.meta.env.VITE_SUPABASE_URL || '');
  const [key, setKey] = useState(parsed.key || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (url.trim() && key.trim()) {
      updateSupabaseConnection(url.trim(), key.trim());
      setStatusMsg('Configuração do Supabase salva com sucesso!');
      setTimeout(() => {
        setStatusMsg('');
        onClose();
      }, 1200);
    } else {
      updateSupabaseConnection('', '');
      setStatusMsg('Supabase desconectado. Usando armazenamento local.');
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-[#fff8f4] p-4 sm:p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: isConnected ? 'var(--secondary)' : 'var(--tertiary)' }}
            >
              <Database size={18} />
            </div>
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">
                Conexão Supabase
              </h2>
              <span className="text-[11px] text-on-surface-variant">
                {isConnected ? 'Banco de dados ativo em tempo real' : 'Armazenamento local ativo'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#201b15] hover:bg-[#f7ece2]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Callout */}
        <div
          className="p-3 rounded-xl flex items-start gap-2.5 text-xs"
          style={{
            backgroundColor: isConnected ? 'rgba(47, 93, 58, 0.12)' : 'rgba(233, 182, 47, 0.2)',
            border: '1px solid var(--border-color)'
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: isConnected ? '#22c55e' : '#f59e0b' }}
          />
          <div className="flex flex-col">
            <span className="font-bold text-on-surface">
              {isConnected
                ? 'Conectado ao seu projeto Supabase!'
                : 'Operando em Modo Híbrido / Local (Sem necessidade de login)'}
            </span>
            <p className="text-on-surface-variant mt-0.5 leading-relaxed">
              {isConnected
                ? 'Os alertas comunitários, roteiros salvos e horários estão sincronizados com sua nuvem Supabase.'
                : 'O Rota Raiz já vem com dados autênticos do Litoral Sul da Bahia e funciona 100% offline via localStorage. Se desejar conectar sua própria instância Supabase, insira as credenciais abaixo.'}
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">
              Project URL
            </label>
            <input
              type="url"
              placeholder="https://seu-projeto.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl text-xs text-on-surface font-mono focus:outline-none"
              style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">
              Anon Public Key (API Key)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl text-xs text-on-surface font-mono focus:outline-none"
              style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--border-color)' }}
            />
          </div>

          {statusMsg && (
            <div className="text-xs font-bold text-center text-primary" style={{ color: 'var(--primary)' }}>
              {statusMsg}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="btn-primary flex-1 h-11 rounded-xl text-xs font-bold"
            >
              Salvar Credenciais
            </button>
            {isConnected && (
              <button
                type="button"
                onClick={() => {
                  updateSupabaseConnection('', '');
                  setUrl('');
                  setKey('');
                  setStatusMsg('Desconectado do Supabase.');
                }}
                className="btn-outline h-11 px-3 rounded-xl text-xs font-bold text-red-600"
              >
                Desconectar
              </button>
            )}
          </div>
        </form>

        {/* SQL Schema Creator Box */}
        <div
          className="rounded-xl p-3.5 flex flex-col gap-2 mt-1"
          style={{
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <FileCode size={16} className="text-[#c2461f]" />
              <span className="font-headline font-bold text-xs text-on-surface">
                Script SQL das Tabelas (Schema)
              </span>
            </div>
            <button
              onClick={handleCopySQL}
              type="button"
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
              style={{
                backgroundColor: copied ? 'var(--secondary)' : 'var(--surface-container)',
                color: copied ? '#ffffff' : 'var(--on-surface)',
                border: '1px solid var(--border-color)'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Copie e cole este script no <strong>SQL Editor</strong> do painel Supabase para criar automaticamente as tabelas <code>community_alerts</code>, <code>tours</code>, <code>routes</code> e <code>user_bookmarks</code> com políticas públicas RLS prontas.
          </p>
        </div>
      </div>
    </div>
  );
}
