# Comunidade e viagens compartilhadas

## Entrega
- Comunidade em feed único, sem “Minhas indicações”. Publicação de dados textuais e Instagram opcional por usuário autenticado. Autoria obtida no servidor a partir da sessão; não vem de campo livre. Dicas não são apresentadas como guias verificados.
- As indicações pendentes da versão anterior são publicadas pela migração, conforme a nova decisão de publicação direta. Indicações rejeitadas permanecem ocultas. Registros antigos sem autor ficam como “Viajante”. Rascunhos do aparelho só são publicados após ação explícita da pessoa.
- Viagens na conta, sem cache financeiro compartilhado entre contas. Participantes com acesso veem o mesmo livro de gastos. Atualização ao focar/voltar à rede e a cada 8 segundos em aba visível.
- Convite com token de uso único e 7 dias, guardado no servidor apenas como hash SHA-256. Login seguido de aceite explícito. Pode vincular um participante que já estava na divisão, evitando duplicá-lo.
- Sair da viagem remove a associação e o acesso da conta. Não apaga a viagem nem despesas antigas dos outros. Sair da conta Google é uma ação separada. Gastos anteriores não são divididos retroativamente com novos participantes.
- Edições usam versão e bloqueio no banco para evitar sobrescrita concorrente. Dados do livro e somas em centavos são validados novamente no servidor.
- Importação dos dados antigos preserva o original e pede identificação de quem é a pessoa na divisão antes de vinculá-la à conta. PDF visual e backup JSON preservados.

## Ativação
Aplicar `migrations/20261023_shared_trips.sql` no projeto Supabase que já atende o login. A migração pode criar a tabela da comunidade se necessário, e é compatível com `20261022_community.sql`. Não requer chave administrativa no navegador nem alteração do OAuth.

A execução no projeto real depende de uma conexão administrativa autorizada com o Supabase. Não confundir os testes PostgreSQL locais com ativação no banco de produção. Publicar o frontend na produção após aplicar a migração e conferir os RPCs.

## Verificação reproduzível
`npm ci`
`node --test tests/*.test.js`
`npm run build`
`npm run lint`

Os testes usam PostgreSQL embarcado (PGlite), três identidades simuladas e a migração real para verificar autoria, privacidade, convite, entrada, edição, versão, saída, expiração e permissões de sessão anônima. Testes React em JSDOM verificam feed único, formulário, convite, preservação antes do login, saída e erro de sincronização. Nenhuma conta Google real é criada nem são publicados dados de teste no banco real.


## Estado da entrega nesta sessão
Implementação e migração prontas, em branch e PR separados. Vinte e um testes passaram, incluindo seis cenários PostgreSQL e seis cenários React, além dos testes existentes de valores e PDF. Build executado e lint sem erros (há avisos de hooks no projeto).

A prévia Vercel desta branch exigiu login da hospedagem, portanto a revisão visual real ficou bloqueada. A página temporária com dados fictícios foi removida. Nenhuma alteração foi integrada à produção e a migração ainda não foi executada no Supabase real: a conexão administrativa sugerida não foi confirmada.
