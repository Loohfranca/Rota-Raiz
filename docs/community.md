# Comunidade compartilhada

Feed único para contas autenticadas, com nome de quem indicou, busca e filtros por categoria. A autoria é obtida da sessão no servidor. Publicações aparecem para outras contas; não são apresentadas como informações verificadas pelo app. Rascunhos antigos continuam no aparelho até a pessoa revisá-los e publicar.

A migração `20261025_community_feed.sql` foi aplicada ao projeto Rota-Raiz em 25/10/2026. Nenhuma tabela de viagens compartilhadas foi ativada nesta entrega. Gastos e PDF atuais permanecem como estavam.

Validação: 11 testes locais passaram, build e lint executados; houve também teste no banco real com duas identidades temporárias, publicação, autoria, leitura pela outra conta e bloqueio de escrita direta e publicação anônima. Toda a transação de teste foi revertida. Nenhuma indicação fictícia foi mantida.

O advisor de SECURITY DEFINER para `rr_publish_recommendation` é intencional: a operação é uma API autenticada que valida o conteúdo e usa auth.uid(), com escrita direta revogada e search_path vazio. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

Revisão visual real pendente: o navegador disponível não alcançou o servidor local e a prévia Vercel exige login. Os testes React validam o fluxo, mas não substituem a conferência visual.

## Percurso a pé das indicações

Em Como ir, A pé abre o roteiro dentro do Rota Raiz. Reaproveita WalkingPanel e o serviço Valhalla já usado nos passeios, com mapa, linha, km, tempo estimado e instruções expandidas. Os outros modos mantêm a consulta externa. Endereços sem coordenadas são pesquisados e a pessoa confirma o resultado antes do cálculo; não se escolhe o primeiro candidato silenciosamente. Origem pode ser editada ou obtida pelo GPS após toque explícito. Alterações de pontos invalidam o traçado antigo; pedidos são cancelados ao sair. Falhas permitem repetir o cálculo.

Verificação: 14 testes passaram, incluindo três testes React de caminhada (mapa e linha reais no DOM de teste, instruções, escolha de endereço e repetição após falha), além de build e lint sem erros. Chamada real ao serviço com pontos públicos de Copacabana retornou status 0, 1,063 km e 13 instruções. A conferência visual autenticada permanece pendente. Não há navegação GPS em tempo real nem mapa-base offline.

## Continuar no Google Maps

Ver como ir abre diretamente o seletor de transporte com os pontos preenchidos, para qualquer origem e destino. O botão Continuar no Google Maps usa Maps URLs, sem adicionar API paga ou chave. Caminhada interna continua disponível como ação secundária. Resultados locais e orientações específicas existentes ficam preservados ao fechar o painel.

O lembrete de baixar a área aparece recolhido em cada painel, com três passos para Android/iPhone e link oficial. O texto distingue mapa baixado no Google Maps de conteúdo do Rota Raiz e explica que ônibus, bicicleta e caminhada não têm cálculo offline no Maps. Fontes: https://support.google.com/maps/answer/6291838?co=GENIE.Platform%3DAndroid&hl=pt-BR e https://support.google.com/maps/answer/6291838?co=GENIE.Platform%3DiOS&hl=pt-BR .

Validação desta etapa: 18 testes passaram; build e lint executados sem erros (avisos do projeto preservados). A revisão visual autenticada continua pendente.
