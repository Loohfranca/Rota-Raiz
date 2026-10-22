# Rota Raiz — Busca nacional de transporte (MVP)

## Meta
A busca é parte do próprio Rota Raiz. Não há chatbot, nem o usuário é redirecionado a um buscador externo.

## Primeiro provedor (opcional)
A API \`/api/rotas\` usa Google Maps Platform Routes API no modo TRANSIT, **via backend Vercel**. Não há chave no bundle React. Sem chave, o sistema mostra uma mensagem honesta de configuração pendente e o roteador regional continua operando normalmente.

### Ativação
1. No Google Cloud, habilitar faturamento e Routes API para o projeto apropriado.
2. Criar uma chave de API de servidor com restrição **somente Routes API** e controles de origem de chamadas apropriados à arquitetura.
3. Adicionar \`GOOGLE_MAPS_ROUTES_API_KEY\` em Environment Variables no projeto Vercel (não usar prefixo \`VITE_\`).
4. Definir limites de cota diária para evitar cobranças inesperadas e monitorar tráfego da função. Aplicar rate limiting robusto antes de liberar amplamente o endpoint público.
5. Fazer deploy/preview e testar consultas reais em Salvador, Rio e destinos regionais, além dos cenários sem resultados e indisponibilidade.

### Limitações
- A cobertura depende dos operadores cadastrados pelo Google; **não cobre necessariamente** vans, lanchas e transporte informal.
- Para tarifas ausentes, exibir "Tarifa não informada"; não tratar \`0\` como gratuito.
- Horários são dados do provedor e não equivalem a confirmações de operação em tempo real.
- O provedor é identificado nas respostas e na interface conforme os requisitos de atribuição.
- Não persistir respostas completas, montar cache global ou reaproveitar dados do Google para evitar consultas; respeitar termos de armazenamento e atribuição.
- A visualização da resposta nacional é **textual**; não desenhar conteúdo de rota fornecido por Google no mapa Leaflet/OpenStreetMap sem análise das condições de licença.
- Entrada é texto livre. No futuro usar geocodificação e autocomplete licenciados, com desambiguação de locais homônimos e data/hora do destino.

## Caminho para independência e economia
1. Cadastro de fontes verificadas por operador/região, com URL, licença, cobertura geográfica, data de verificação, frequência esperada e responsável.
2. Importar feeds oficiais GTFS/GTFS-RT onde existirem. Para rede aberta, usar OpenTripPlanner + OpenStreetMap como motor de cálculo.
3. Complementar com cadastro auditado de vans, balsas, trilhas, transporte intermunicipal e alternativas de última milha.
4. Memória/cache compartilhados **apenas para dados próprios e de fornecedores cujas licenças permitam**. Chave composta por origem, destino, data/hora, perfil do viajante, fonte e versão dos dados. Invalidação por fonte/trecho atualizado.
5. Agente de IA de retaguarda compara documentos autorizados, identifica alterações e envia propostas para revisão humana. Não publicar mudança automaticamente sem evidência auditável.
6. Rotas de ida e volta, restrições do último transporte, dias de operação, feriados, custo parcial ou desconhecido e tempo necessário para baldeação.

## Arquitetura
\`Pesquisa do usuário → busca regional própria quando coberta / provedor nacional quando configurado → normalização de itinerário → apresentação transparente (fonte, validade, lacunas)\`.

O sistema não é, nesta etapa, um cadastro nacional de linhas e tarifas. O MVP conecta uma fonte nacional opcional para a busca textual e prepara o caminho de expansão GTFS por região.
