import React from "react";
import { Download, ChevronDown } from "lucide-react";

export default function OfflineMapTip() {
  return (
    <details className="offline-map-tip">
      <summary>
        <Download size={19} aria-hidden="true" />
        <span>
          <b>Antes de sair, baixe a área</b>
          <small>Um cuidado a mais para quando faltar sinal.</small>
        </span>
        <ChevronDown
          size={17}
          className="offline-tip-chevron"
          aria-hidden="true"
        />
      </summary>
      <div className="offline-map-steps">
        <p>No celular, com internet, abra o Google Maps:</p>
        <ol>
          <li>
            Toque na sua foto de perfil e em <b>Mapas off-line</b>.
          </li>
          <li>
            Entre em <b>Selecione seu mapa</b> e enquadre a região da viagem.
          </li>
          <li>
            Toque em <b>Download</b> e espere terminar antes de sair.
          </li>
        </ol>
        <p>
          O mapa fica salvo no Google Maps deste celular. O Rota Raiz não baixa
          nem confirma esse download.
        </p>
        <p className="offline-map-limit">
          Ônibus, bicicleta e caminhada precisam de internet para calcular rotas
          no Google Maps. De carro, o percurso inteiro precisa estar na área
          baixada; trânsito ao vivo fica indisponível.
        </p>
        <a
          href="https://support.google.com/maps/answer/6291838?hl=pt-BR"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver a orientação do Google
        </a>
      </div>
    </details>
  );
}
