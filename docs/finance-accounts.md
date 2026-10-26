# Na conta: individual e compartilhado

A aba Na conta concentra o financeiro. Minhas viagens continua reservada às experiências e ao roteiro; nenhum recurso de roteiro foi implementado nesta mudança. Lugares salvos saíram da tela financeira, sem apagar o conteúdo salvo no Explorar.

- Individual: contas privadas por usuário, uma pessoa, sem convite. O servidor recusa convites e alterações que tentem transformar uma conta individual em grupo.
- Compartilhado: contas por viagem, convites de uso único com validade de sete dias, aceite após login, identificação do perfil e acesso somente aos grupos dos quais a conta participa. Um nome na divisão não concede acesso: o convite vincula o perfil a esse nome ou acrescenta uma nova pessoa.
- Gastos: quem pagou, participantes da divisão, valores iguais ou personalizados, cálculo em centavos, prévia da divisão, categorias e resumo pessoal. Pessoas que entram depois não são incluídas retroativamente nas despesas; a divisão de despesas anteriores pode ser editada.
- Atualização: consulta a cada oito segundos enquanto a página estiver visível, ao retomar a janela/rede e pelo botão Atualizar. Não é navegação offline: se o salvamento falhar, o formulário continua aberto e não simula sincronização.
- Conflitos: versões e bloqueio da conta impedem sobrescrever uma atualização concorrente. O usuário deve reabrir um formulário antigo para conferir a versão atual.
- Relatórios: PDF por conta e por modalidade, preservando o relatório visual existente. Backup JSON aparece separado. Os gastos pessoais não são incluídos no PDF de um grupo.
- Registros antigos: o armazenamento rotaraiz_trips_v1 não é apagado ou enviado automaticamente. A pessoa escolhe a conta a importar e identifica seu nome. Contas antigas com várias pessoas devem ser importadas em Compartilhado; acesso a outras contas só ocorre com convite e aceite.

## Banco e acesso

Migração financeira independente da comunidade. As tabelas shared_trips, trip_members e trip_invitations têm RLS e nenhum privilégio direto para anon/authenticated. Apenas os RPCs autorizados podem acessar os dados, verificando auth.uid() e associação ao grupo. Contas individuais também são restringidas ao proprietário. Convites guardam somente o hash do token.

SECURITY DEFINER é intencional nos RPCs transacionais: criação/aceite precisam manipular conta, membros e convite atomicamente, sem conceder escrita direta a essas tabelas. search_path é vazio, funções auxiliares não são executáveis pelo cliente e anon não pode chamar nenhum RPC financeiro. O nome em user_metadata é apenas apresentação, nunca autorização.

Os avisos dos advisors sobre funções SECURITY DEFINER autenticadas e RLS sem policies refletem esse modelo com acesso exclusivamente por RPC. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable e https://supabase.com/docs/guides/database/postgres/row-level-security. Proteção de senhas vazadas e índices de tabelas preexistentes estão fora desta alteração.

## Verificação

Testes locais cobrem dinheiro, divisão com centavos, PDF, convites, aceite, privacidade individual, alteração entre contas, saída, link expirado e versão concorrente. Uma transação no banco de produção com dois usuários sintéticos verificou as permissões, aceite, sincronização, privacidade e saída; ROLLBACK removeu todos os dados de teste.

Build e lint foram executados. A revisão visual em navegador autenticado permanece pendente por depender de login; a prévia local não está acessível ao navegador remoto. Não foi criada rota pública para contornar a autenticação.
