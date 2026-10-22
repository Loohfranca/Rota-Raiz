# Viagens e comunidade — 22/10/2026

Quatro abas: Explorar, Como chegar, Minha viagem, Comunidade. Mapa contextual continua acessível pelas duas primeiras abas e pelos detalhes; filtros de lugares e embarques preservados. Links de modos externos passam a abrir num painel compacto.

## Viagens
- Dados privados guardados exclusivamente no localStorage deste navegador (`rotaraiz_trips_v1`). Não são enviados ao Supabase. Sem sincronização automática ou convite dos participantes.
- Valores em centavos inteiros. Divisão igual distribui os centavos restantes na ordem selecionada; divisão personalizada exige soma exata. O pagador pode estar fora da divisão.
- Pessoas referenciadas em despesas não podem ser removidas. Alterações de participantes não modificam despesas anteriores.
- Acertos são sugestões derivadas do saldo; transferências de quitação não são registradas. Os números não representam dinheiro efetivamente transferido.
- Relatório por categoria/pessoa, lista de despesas, média pelo intervalo entre primeiro e último registro. Impressão do navegador permite salvar PDF.
- Backup JSON versionado de todas as viagens e restauração com validação. Importação conflitante pede confirmação por viagem antes de substituir.
- Lugares salvos existentes aparecem na área da viagem; são os salvos gerais do navegador, não um roteiro separado por viagem.

## Comunidade
- Sem Supabase/tabela habilitada: indicações ficam como rascunhos locais, com exportação. O app informa que não houve envio. Nenhuma dica fictícia é apresentada como recomendação real.
- Com tabela disponível: leitura apenas de registros `approved`; envio apenas `pending`. Nenhuma aprovação por frontend público.
- Aplicar `migrations/20261022_community.sql` na instância Supabase existente. Migração não foi aplicada automaticamente: não há conexão administrativa com o banco nesta sessão.
- Revisão via painel administrativo do Supabase, conferindo nome/endereço/Instagram e preenchendo `reviewed_at` ao aprovar. Operação e experiência continuam sujeitas a mudanças.
- Antes de abertura ampla, adicionar limitação de envios/CAPTCHA no servidor; a migração mantém submissão anônima pendente. Dados de revisão nunca podem ser alterados por anon/authenticated.
- A aba Descobrir permite busca/categoria; indicações aprovadas aparecem também ao final de Explorar (cidade aproximada pela origem escolhida). Sem geocodificação de rascunhos nem falsa distância.

## Verificação
`node --test tests/tripLedger.test.js`: moeda, centavos, compensação cruzada, categorias, divisão personalizada, consistência de restauração e média diária. Build/lint, seguidos de revisão visual no navegador.
