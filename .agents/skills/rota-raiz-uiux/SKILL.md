---
name: rota-raiz-uiux
description: Skill local e exclusiva do Rota Raiz para pesquisa de destinos, design editorial de viagens, UI responsiva, revisão visual e auditoria de dados de acesso. Ative em tarefas de interfaces, praias, passeios, rotas, mapas e experiência offline neste repositório.
---

# Rota Raiz — Skill Master de UI/UX Design (v1.0)

## Escopo inegociável

- Aplicar SOMENTE ao repositório Loohfranca/Rota-Raiz, nunca globalmente.
- Não instalar configurações em diretórios de usuário, não alterar outros repositórios e não copiar indiscriminadamente o Agent Devkit.
- Esta é uma skill de processo, não uma autorização para alterar produto, base de dados, autenticação, backend ou produção.
- Não fazer deploy, merge para main nem publicar alterações sem pedido explícito.
- Se algum recurso de pesquisa, navegador, screenshot ou teste não estiver disponível, declarar a limitação; não simular execução.
- Ler primeiro docs/ROTA_RAIZ_UX_SYSTEM.md e o código afetado antes de propor alteração.

## Missão

Criar uma experiência editorial premium, com alma baiana, útil em situações reais:
1. Descobrir uma praia ou passeio.
2. Entender de onde sair e quais opções reais existem para chegar.
3. Saber quando ir, custos aproximados, marés, limitações e como voltar.
4. Consultar informações críticas sem sinal de internet.

Regra de ouro: beleza visual nunca substitui informação de deslocamento correta. Uma praia não está pronta para publicação só porque possui foto, descrição e botão no mapa.

## Contexto técnico real (confirmar antes de alterar)

- React 19, Vite, Tailwind CSS v4 e CSS tokens em src/index.css.
- JavaScript/JSX; NÃO presumir TypeScript.
- Ícones lucide-react; Leaflet, React-Leaflet e OpenStreetMap; persistência Supabase com fallback local.
- Telas: src/App.jsx, src/components/RoutesView.jsx, RouteDetailView.jsx, ToursView.jsx, TourDetailView.jsx, AccessGuide.jsx, WalkingPanel.jsx, MapView.jsx, BottomNav.jsx e Navbar.jsx.
- Dados: src/data/beachCatalog.js, beachGuides.js e seedData.js.
- Lógica: src/lib/router.js, walking.js, nearby.js e supabase.js.
- Não substituir algoritmos de roteamento nem a estrutura offline por propostas de design.

## Gatilhos e modos de operação

ATIVAR para: redesign, criação de tela, componente, revisão de interface, conteúdo visual de destino, acessibilidade, responsividade, auditoria de design, mapas e fluxos de passeio.

Escolher um ou mais modos:
- **DISCOVER**: pesquisar informações confiáveis do destino e mapear necessidades dos viajantes.
- **DESIGN**: hierarquia visual, layout, componentes e variações mobile/desktop.
- **IMPLEMENT**: mudanças pequenas e integradas ao sistema existente.
- **AUDIT**: comparar antes/depois, testar interações e emitir diagnóstico real.

Nunca pular DISCOVER ao criar ou reformular conteúdo de acesso a praia, trilha, transporte ou passeio.

## Protocolo obrigatório 0 — reconhecimento

1. Localizar a tela, seus componentes, fontes de dados e dependências.
2. Identificar fluxo de entrada, seleção de origem, cálculo de rota, consulta de mapa, salvamento offline e retorno.
3. Levantar tokens de src/index.css e divergências visuais que já existem no JSX.
4. Distinguir **problema de conteúdo/dados** de **problema visual**: corrigir a causa, não apenas disfarçar com CSS.
5. Apresentar quais arquivos serão afetados e riscos de regressão, sem modificar além do pedido.
6. Preservar o funcionamento atual de rotas, PWA, GPS, filtros, painel administrativo e salvamentos.

## Protocolo obrigatório 1 — pesquisa factual para guias de praias

Para cada destino novo ou refeito, consultar, quando possível:
- Fontes oficiais pertinentes (município, gestão ambiental, autoridades de navegação, tábuas de maré, operadores reais).
- Guias locais e operadores especializados que descrevam o trajeto efetivo.
- Mapas e imagens georreferenciadas para conferir pontos de partida, travessias e desembarques.
- Mais de uma fonte independente quando houver divergência material sobre um trajeto.
- Informações sobre ida E volta, incluindo horários de último transporte e contato com operadores quando aplicável.

Registrar no resultado editorial: nome do destino; data de verificação; URL das fontes; trecho sustentado por cada fonte; eventuais divergências; informações ainda não confirmadas. Fontes devem ser links reais, não inventados. Uma menção no Google não equivale à confirmação da operação atual.

### Campos mínimos de cada alternativa de acesso

- Modalidade (a pé, canoa, lancha, van/ônibus, carro/táxi etc.), só quando ela realmente existir.
- Origem de referência precisa (vila, cais, parada, margem, estacionamento), sem presumir a localização do viajante.
- Ordem completa das etapas, incluindo travessias, baldeações, caminhadas, embarque e desembarque.
- Distância e tempo com referência explícita ao trecho e **tipo de medida**; nunca usar linha reta como distância de caminhada, estrada ou viagem.
- Custo discriminado por trecho, por pessoa e por sentido, quando verificável; mencionar custo de volta quando relevante.
- Dependência de maré, condições do mar, chuva, acesso restrito, propriedades privadas e segurança.
- Condições para o retorno e acessibilidade real (escadarias, areia fofa, barrancos, desembarque na água).
- Fonte(s), data e nível de confiança.

Se não houver dado verificável: usar “a confirmar”, “sob consulta” ou texto descritivo honesto. Nunca inventar tarifas, duração, horários, disponibilidade, coordenadas ou trechos completos.

### Caso de controle: Praia do Satú, a partir de Caraíva

Antes de considerar o guia válido, conferir se:
- O acesso costeiro inclui a travessia do Rio Caraíva de canoa antes da caminhada.
- O trajeto a pé é descrito **depois** da travessia, sem apresentar deslocamento direto impossível.
- As alternativas de barco e carro/táxi são tratadas com suas condicionantes, não como equivalentes incondicionais.
- O impacto da maré, as condições do retorno, eventuais reservas/acesso particular e variação de preço aparecem de forma clara.
- Números existentes no catálogo são referências sujeitas à verificação; não devem ser promovidos a dados atuais sem conferência.

## Protocolo obrigatório 2 — design editorial do Rota Raiz

Priorizar:
- Aspecto sofisticado, acolhedor e regional, sem excesso de ornamentos, efeitos e cards sem propósito.
- Tipografia com identidade: Bricolage Grotesque nos títulos; DM Sans no conteúdo; fallbacks funcionais.
- Hierarquia clara: destino → resumo útil → escolha de transporte → passos → custos/tempo → maré/alertas → mapa → fontes.
- Conteúdo escaneável em movimento: seções curtas, títulos descritivos, fatos importantes antes de textos poéticos.
- Fotografias **reais, pertinentes ao local e com licença/atribuição verificadas**; nunca imagem errada para preencher card.
- Ritmo visual por espaços, imagens e tipografia; não repetir a mesma estrutura de cartões em todas as seções.
- CTA com verbo e resultado (ex.: “Ver trajeto no mapa”), não botões vagos.
- Uma ação principal por contexto; opções secundárias com peso visual reduzido.

Evitar AI slop: gradiente roxo/azul genérico; glassmorphism desnecessário; centenas de sombras; cantos arredondados idênticos em tudo; ícones decorativos sem significado; textos promocionais vazios; carrosséis sem utilidade; microanimações que atrasam.

Reutilizar componentes existentes primeiro. Não criar novo design system conflitante, novas fontes, novas bibliotecas ou paletas paralelas sem justificativa técnica e aprovação quando o escopo aumentar.

## Protocolo obrigatório 3 — acessibilidade e interação

- Projetar mobile-first e considerar uso sob luz solar, sinal instável e distrações durante deslocamento.
- Alvos de toque preferencialmente >= 44 x 44 CSS px, com espaçamento entre alvos próximos.
- Garantir foco visível, navegação por teclado, rótulos de controles e estado selecionado perceptível sem depender só de cor.
- Meta WCAG 2.2 AA: contraste de texto normal >= 4.5:1 e texto grande >= 3:1; checar combinações reais.
- Evitar textos importantes abaixo de 12 px; preferir >= 14 px para detalhes e >= 16 px no corpo.
- Respeitar prefers-reduced-motion e não depender de animação para sinalizar sucesso/erro.
- Testar leitura e navegação com textos longos, zoom, preferências de tamanho de fonte, teclado virtual e safe areas.
- Alertas de risco (maré alta, travessias, último retorno) devem aparecer no fluxo principal, não escondidos exclusivamente em tooltip ou acordeão.
- Mapas precisam de alternativa textual para informações indispensáveis; não depender de cor ou GPS para compreender uma rota.

## Protocolo obrigatório 4 — estados e contexto de viagem

Toda tela modificada deve considerar:
- Origem definida, origem não definida e origem GPS indisponível.
- Online, offline, sincronizando, cache desatualizado e dado não verificado.
- Carregando, vazio, erro, sucesso e retorno da tela detalhada.
- Dados ausentes sem números inventados e avisos honestos de confiança.
- Diferença entre “localização aproximada no mapa”, “trajeto esquemático” e “rota navegável”.
- A ida pode ser possível e a volta inviável: isso deve constar da informação exibida quando houver evidência.
- Saved/offline: diferenciar item salvo de conteúdo efetivamente disponível offline; não prometer offline sem teste.

## Protocolo obrigatório 5 — engenharia visual e responsividade

- Manter tokens oficiais em src/index.css e documentação docs/ROTA_RAIZ_UX_SYSTEM.md.
- Investigar a causa raiz de overflow, sobreposição, desproporção e botões cortados; não esconder o bug com overflow-x: hidden global.
- Verificar larguras 320, 360, 390, 430, 768, 1024 e 1440 CSS px; conferir orientação landscape quando relevante.
- Checar bottom navigation, áreas seguras, barras fixas, cabeçalhos, modais e teclado virtual.
- Para mapa Leaflet, verificar altura utilizável, gesto, zoom, painel sobreposto e controles do mapa no mobile.
- Garantir reflow de títulos grandes, valores monetários, chips, listas de passos e textos de alerta.
- Preservar performance: lazy load de fotos, dimensões de imagens, carregamentos sem mudanças bruscas de layout.
- Não degradar desktop para resolver mobile, nem ocultar funcionalidades para “passar” no teste responsivo.

## Protocolo obrigatório 6 — auditoria e critérios de aprovação

Inspecionar em cada tela alterada (0 a 5 pontos, reportar evidência e não apenas nota):
1. Fidelidade à identidade Rota Raiz.
2. Hierarquia e escaneabilidade.
3. Clareza de acesso/retorno do viajante.
4. Precisão e rastreabilidade dos dados turísticos.
5. Componentes e tokens consistentes.
6. Responsividade e toque.
7. Acessibilidade e contraste.
8. Mapas, coordenadas e significado das distâncias.
9. Estados offline, erro e informação não confirmada.
10. Polimento de textos, alinhamentos, ícones e imagens.

**Bloqueadores**, mesmo com boa pontuação: trajeto inventado ou impossível, dado de preço/horário apresentado como confirmado sem fonte, ação essencial inacessível no mobile, regressão funcional, alerta de segurança oculto, distância em linha reta tratada como rota, claim de funcionamento offline não testado ou fotografia com origem/licença inadequada.

O trabalho é considerado concluído somente após:
1. Revisão do diff e dos arquivos afetados.
2. npm run lint e npm run build quando o ambiente tiver dependências disponíveis.
3. Inspeção visual de telas afetadas (captura real se navegador disponível) nos breakpoints.
4. Testes de fluxo relevantes (ex.: selecionar origem → praia → acesso → mapa → voltar; salvar e reabrir offline).
5. Checagem de acessibilidade por teclado e contraste.
6. Relatório do que **foi efetivamente testado**, evidências e pendências; não afirmar testes inexistentes.

## Modelo obrigatório de resposta ao concluir cada intervenção

**Diagnóstico:** problema observado, causa raiz e contexto do usuário.
**Pesquisa e fontes:** links reais, quando a mudança envolve trajetos/conteúdo.
**Alterações:** arquivos e mudanças precisas.
**Validação:** execução real de comandos, breakpoints, fluxos e screenshots; informar testes não executados.
**Pendências:** dados a confirmar, riscos e passos seguintes.
**Publicação:** branch/PR; nunca alegar merge ou deploy se não ocorreu.

## Arquivos de referência obrigatórios

- docs/ROTA_RAIZ_UX_SYSTEM.md — tokens, padrões de página e checklist.
- src/index.css — tokens CSS implementados.
- src/components/AccessGuide.jsx e TourDetailView.jsx — guia de acesso e página de destino.
- src/data/beachCatalog.js e beachGuides.js — catálogo e roteiro editorial.
- src/lib/router.js e walking.js — diferença entre grafo e traçados de caminhada.

Esta skill guia futuras mudanças. Sua mera instalação não altera telas, não pesquisa automaticamente praias e não constitui auditoria executada.
