# Rota Design 1.0

Design system do Rota Raiz, inspirado na nova marca enviada: símbolo do pé/caminho terracota e palavra **rota raiz** em verde.

## Regras de cor

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--primary` | `#B9552C` | `#E58A57` | Terracota: acentos, links e indicadores |
| `--secondary` | `#305D37` | `#8BBF7B` | Verde: botões e navegação |
| `--surface` | `#F7F4EE` | `#151A16` | Fundo do app |
| `--surface-container-lowest` | `#FFFEFB` | `#252D26` | Cartões e painéis |
| `--on-surface` | `#253327` | `#F5F3EC` | Texto principal |
| `--on-surface-variant` | `#606A5C` | `#C3CFC0` | Texto secundário |
| `--border-color` | `#DCD7C9` | `#536055` | Bordas |

Preferir os tokens acima em componentes novos. Evitar hexadesimais fixos, `#fff` e `#000` quando forem fundos/cores de texto. Um controle precisa manter contraste e feedback em ambos os temas.

## Marca

- `public/rota-mark.svg`: símbolo vetorizado do pé/caminho a partir da imagem enviada (versão de interface)
- `public/icon-192.svg`, `public/icon-512.svg`: ícones do app
- `Navbar.jsx`: símbolo + logotipo em texto para tamanho reduzido
- `LoginScreen.jsx`: símbolo + logotipo em texto para maior legibilidade

O logotipo de interface reconstrói o lettering em CSS e **não é o arquivo de arte final vetorial original**. Substituir pelo SVG oficial quando disponível.

## Interface

- Terracota como acento; não usar só verde em cards e fundos.
- Botão primário em verde com `--on-secondary`.
- Fundo creme claro / carvão esverdeado, não branco/preto absolutos.
- Cards com bordas suaves e sombra discreta.
- Grade de fotos única do Perfil do Viajante permanece sem cards por cidade.
- Tema claro/escuro na classe raiz `data-theme`, sem duplicar lógica.
- Área de toque de controles >= 40–44px, estados de foco visíveis.

## Publicação

Alterações ficam na branch de design e PR de revisão, sem merge até a janela de publicação acordada. Antes de produção: validar fluxo login, navegar pelas 5 áreas principais, alternar temas, verificar modais, campos, galeria, PWA e contraste em aparelho real.
