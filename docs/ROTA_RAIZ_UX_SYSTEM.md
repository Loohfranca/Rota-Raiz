# Rota Raiz — sistema de experiência, identidade visual e auditoria

Documento de referência local da Skill Master. Status: diretrizes de projeto para mudanças futuras; não representa telas já aprovadas ou testes já executados.

## 1. Produto e promessa editorial

O Rota Raiz não é um catálogo genérico de lugares bonitos. É um guia de deslocamento e descoberta do litoral sul da Bahia, para viajantes que precisam tomar decisões práticas pelo celular.

Prioridades na ordem: **informação factual e segurança → clareza das opções → usabilidade em campo → acabamento visual → efeitos**.

Percursos principais:
- Planejar transporte: origem → destino → opções disponíveis → etapas, preço, tempo, alertas → mapa → salvar.
- Descobrir praia: escolher região ou origem → explorar opções → guia do destino → escolher acesso → planejar ida/volta → mapa e fontes.
- Viajar sem internet: abrir um item realmente armazenado → ler itinerário salvo → distinguir último dado conhecido de informação atual.

## 2. Identidade visual existente — preservar

Fonte da verdade implementada: src/index.css, revisada antes de cada intervenção.

| Token | Cor atual | Uso editorial sugerido |
|---|---|---|
| --primary | #C2461F | CTA e ação principal, destaques relevantes |
| --primary-hover | #A02E06 | Hover do primário |
| --secondary | #2F5D3A | Orientação, natureza e ações secundárias |
| --surface | #FFF8F4 | Superfície de conteúdo |
| --surface-container-low | #FDF2E7 | Blocos suaves e guias |
| --surface-container | #F7ECE2 | Separação sutil |
| --on-surface | #201B15 | Texto principal |
| --on-surface-variant | #59413B | Texto secundário |
| --border-color | #E0D5C1 | Bordas estruturais |
| --tertiary-container | #E9B62F | Detalhes de destaque; não substituir cor de alerta |

Paleta de referência no README: areia #F4EDE0, terracota #C2461F, verde-mata #2F5D3A e amarelo-ouro #E9B62F. Essas cores não dispensam teste de contraste, especialmente em textos pequenos.

Tipografia atual: Bricolage Grotesque para títulos; DM Sans para interface e texto. Preservar fallback de sistema. Não introduzir novas fontes por página.

Estética: rota local, natureza, materiais orgânicos e tipografia editorial, com interface contemporânea e objetiva. Evitar que todo bloco vire cartão branco idêntico. Usar respiro, divisores, escala tipográfica, fotografia legítima e agrupamentos semânticos.

## 3. Regras de layout

- Mobile-first, viewport e safe areas reais. Não esconder conteúdo para corrigir largura.
- Preferir composição com 1 coluna no celular e grades apenas onde a comparação agrega valor.
- Manchete da praia legível em 320 px; a foto deve servir o conteúdo, não encobri-lo.
- CTA principal em zona de alcance confortável, mas nunca fixar elemento sobre navegação inferior.
- Mapa com ação de retorno clara; ferramenta de navegação não deve bloquear alertas.
- Textos editoriais devem ser acessíveis sem abrir dezenas de cards.
- Botões e filtros com área de toque de no mínimo 44 x 44 px como padrão do produto.
- Não depender exclusivamente de hover, cor, animação, geolocalização ou conexão online.

## 4. Arquitetura editorial para detalhe de uma praia

Sequência recomendada, adaptável ao caso (não adicionar seções vazias):
1. **Cabeçalho** — voltar; nome correto; localização; foto real creditada.
2. **Resumo prático** — por que ir, melhor condição de maré, grau de esforço/complexidade.
3. **Como chegar** — formas de acesso reais, partindo da origem declarada; destacar travessia e deslocamento do ponto de partida.
4. **Etapas de cada opção** — origem, embarque, transbordos, caminhada, desembarque, retorno.
5. **Tempo e custo** — valores separados por trecho, indicação de estimativa, fonte e data.
6. **Cuidados e estrutura** — maré, calçado, água, restrições de acesso, serviços, escadaria, mobilidade.
7. **Mapa** — ponto de referência ou traçado verificável, com distinção entre estimativa e navegação.
8. **Fontes** — links rastreáveis, data de consulta e o que ainda falta confirmar.
9. **Offline** — estado claro, com conteúdo crítico acessível caso a rede caia.

### Padrão de dados e afirmações

- Jamais representar quilômetros em linha reta como distância de trajeto de carro/caminhada.
- “Cerca de 4 km após a travessia” não é equivalente a “4 km da sua hospedagem”.
- “Em torno de 50 min” é referência contextual, não ETA instantâneo.
- “Tarifa a confirmar” não deve virar número decorativo no card.
- Quando a ida depende de maré, informar o impacto na volta.
- Foto com localização, autor, fonte e licença compatíveis; nunca usar foto de praia parecida como se fosse a original.
- Fontes comerciais são complementares; para marés, segurança, balneabilidade e acesso oficial, preferir instituições competentes.
- Sempre distinguir: confirmado por fonte, estimativa publicada, condição dependente do dia, informação ausente.

## 5. Componentes e arquivos a reutilizar

| Necessidade | Referência existente |
|---|---|
| Navegação geral | src/App.jsx, Navbar.jsx, BottomNav.jsx |
| Lista de praias e filtros | src/components/ToursView.jsx |
| Página de destino | src/components/TourDetailView.jsx |
| Como chegar | src/components/AccessGuide.jsx |
| Caminhada e distâncias | src/components/WalkingPanel.jsx, src/lib/walking.js |
| Transporte em grafo | src/components/RoutesView.jsx, src/lib/router.js |
| Mapa | src/components/MapView.jsx |
| Imagens | src/components/BeachPhoto.jsx |
| Fichas dos lugares | src/data/beachCatalog.js, src/data/beachGuides.js |

Ao encontrar estilos hardcoded repetidos no JSX, propor consolidação incremental em tokens e componentes; não aplicar substituição cega sem verificar estados selecionados, hover, legibilidade e efeitos em outras telas.

## 6. Requisitos por viewport

| Largura | O que verificar |
|---|---|
| 320 px | Títulos e botões sem corte; etapas completas; mapas e filtros navegáveis |
| 360 px | Navegação inferior, chips, teclado e CTA |
| 390 px | Espaço para preços, notas e seleção de acesso |
| 430 px | Ritmo de cards e leitura sob scroll |
| 768 px | Transição para tablet sem grandes vazios |
| 1024 px | Proporções, legibilidade e navegação desktop |
| 1440 px | Limites de largura, hierarquia e composição editorial |

Acrescentar landscape, zoom 200%, teclado por tabulação e tamanho de fonte aumentado quando ferramentas permitirem.

## 7. Matriz de riscos de UX

**Críticos:** deslocamento impossibilitado por maré omitida; travessia faltando; distância de linha reta apresentada como rota; retorno omitido; botão essencial inacessível; offline prometido mas não disponível.

**Altos:** contrastes insuficientes; foto de destino incorreto; preços sem qualificação; estados de GPS ou dados não carregados enganando o usuário; informação histórica apresentada como vigente.

**Médios:** tipografia inconsistente; quantidade excessiva de cards; repetição de textos; desalinhamentos e ícones sem função.

Não declarar “aprovado” enquanto houver crítico ou alto não resolvido na área modificada.

## 8. Relatório mínimo por entrega

- O que foi pedido e quais telas foram investigadas.
- Diagnóstico e arquivos alterados.
- Evidências de pesquisa e divergências encontradas.
- Print antes/depois por viewport, quando houver navegador funcional.
- Resultado real de lint/build e dos fluxos executados.
- Problemas conhecidos que ficaram fora do escopo.
- Branch e PR; status de publicação separado do status do código.

## 9. Exemplo de aceitação — Satú saindo de Caraíva

O guia deve mostrar que a alternativa costeira começa com **canoa no Rio Caraíva** e só depois continua com caminhada pela areia. Deve também mostrar alternativas condicionais de embarcação e transporte terrestre, alertas de maré, acesso e retorno. Distância, preço e duração devem trazer origem/referência, condição e fonte verificável; não inventar atualização de valor.

Esta seção é um **teste de qualidade editorial**, não certificação de que valores existentes no repositório estejam atualizados.
