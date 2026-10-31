# Parte 3 — Busca interna publicada

Base: `f929022` (Parte 2 já publicada), utilizando `rr_places` e não o catálogo curado `places`. A implementação antiga da branch local foi adaptada, sem publicar a estrutura incompatível ou as Partes 4–6.

## Entrega

- Autocompletar desde uma letra, debounce 180 ms, até oito sugestões, cancelamento de consultas antigas e navegação por teclado.
- Busca por nome, categoria, município, estado e destino, sem distinguir acentos/caixa. Nome exato, início do nome e palavras do nome têm prioridade sobre região/categoria.
- Cadastro completo por ID ao selecionar; dados compartilhados protegidos nos formulários atuais da Comunidade e do Perfil. Opção “Cadastrar novo lugar” mantém o cadastro manual anterior.
- Homônimos são candidatos separados. Possível duplicata exige nome, município, estado e endereço ou ponto coincidentes; não funde registros automaticamente.
- Destinos utilizam uma relação opcional `rr_places.destination_id` com `rr_destinations` (nome, município e UF). Não foram inventados destinos ou preenchidos vínculos automaticamente. A tabela inicia vazia; Boipeba e seus lugares aparecem quando houver cadastro e relacionamento reais.
- A busca usa exclusivamente `rr_places`, sem importar catálogo estático, Google ou resultados externos. Continua separada da busca de origem/rotas.

## Compatibilidade e segurança

Migração `20261031024134_internal_place_search.sql` aplicada e alinhada à versão registrada no Supabase. Adiciona somente campos/índices de busca, relação de destino e funções necessárias à seleção. Não substitui a migração da Parte 2.

Consultas usam `SECURITY INVOKER`, RLS e acesso autenticado. Documentos tsvector/GIN e índices de nome/destino evitam baixar o catálogo inteiro. Texto limitado a 80 caracteres/dez termos e limite de dez resultados no servidor.

Os formulários atuais continuam com suas regras anteriores; formulário único/data obrigatória/duas fotos da Parte 4 não foram incluídos. As funções de seleção hidratam o lugar no servidor, verificam autenticação, autoria e versão e preservam os triggers de moderação existentes. Não alteram dados de outro autor nem os dados compartilhados do lugar. Álbuns antigos do Perfil e seus arquivos não são convertidos nesta etapa.

Rollback protegido em `supabase/rollback/internal_place_search.sql`: recusa apagar destinos cadastrados. Conserva os dados da Parte 2 e os vínculos já registrados; após adoção, preferir rollback do frontend ou correção aditiva.

## Verificação da produção

Antes/depois da migração: oito lugares, doze indicações, sete curtidas, três comentários, nenhuma fotografia canônica ou metadado de fotografia de Perfil. Checksums dos campos existentes de lugares e indicações permaneceram idênticos. Nenhuma publicação, fotografia ou interação foi criada como teste em produção.

Consulta real autenticada em transação de leitura desfeita retornou sugestões desde “P”, Pelourinho com prioridade de nome exato e vazio sem texto. Nenhuma conta de usuário foi acessada ou alterada.

## Testes

- Testes locais de SQL sobre a Parte 2 publicada: primeira letra, acentos/Unicode, relevância, categoria/cidade/UF, destino/escopo, homônimos, seleção completa, autoria, versão e bloqueio de escrita/anônimos.
- Testes de repositório e formulário: cancelamento, respostas obsoletas, erro/vazio, teclado e escolha explícita antes de preencher.
- Regressões da migração da Parte 2 e build Vite.
- Chromium local em 320/390/768/1440 px: busca de uma letra, seleção, campos compartilhados protegidos e envio preservando place_id. Sem erro JavaScript ou overflow. API simulada; não houve publicação real de teste.

Advisors consultados antes/depois: alertas de funções privilegiadas autenticadas são esperados para os endpoints que validam autoria no servidor; funções de busca permanecem invoker. Avisos de configuração de Auth e tabelas privadas já existiam e não foram alterados nesta publicação.

## Correção: indicações antigas sem lugar central

O teste real com Moreré revelou um erro de integração: a pesquisa só consultava `rr_places`, enquanto a indicação antiga estava em `community_recommendations` com cidade “Bahia” e referência “Ilha de Boipeba”, sem vínculo central. A indicação era visível, mas a pesquisa afirmava não encontrá-la.

Migração corretiva: `20261031025400_legacy_place_search_completion.sql`, alinhada ao Supabase. A pesquisa agora também consulta indicações aprovadas, não excluídas e ainda não vinculadas, por nome/categoria/localização/referência, com índice GIN e o mesmo limite de resultados. Esses resultados têm o rótulo “Cadastro antigo · Localização a completar”. Não são misturados resultados externos.

Selecionar um registro incompleto recupera os dados originais, deixa município/UF para confirmação e preserva a referência existente. Nenhum município é inferido de “Bahia” ou “Boipeba”. Perfil e Comunidade permitem completar explicitamente esses dados antes de continuar. Na Comunidade, a publicação e o cadastro central ocorrem na mesma transação; no Perfil, o álbum recebe o ID do cadastro confirmado antes da gravação.

A confirmação cria um lugar central com `legacy_source_id` (FK com ON DELETE SET NULL), sem alterar relato, localização histórica, fotos, curtidas ou comentários da indicação de origem. A origem pode pertencer a outra pessoa: seus dados não são editados. A nova publicação pertence à pessoa autenticada. Nome e categoria são recuperados no servidor, e município/UF/referência precisam ser confirmados. A repetição para a mesma origem reutiliza o cadastro explicitamente criado, sem sobrescrevê-lo. Homônimos de outras origens continuam separados; conflito de identidade pede escolha manual, sem fusão automática.

Após essa confirmação, a pesquisa retorna o lugar central e deixa de repetir a sugestão antiga da mesma origem. A relação à origem permite uma reconciliação futura sem inventar um vínculo ou modificar a experiência histórica. Não associa automaticamente origens diferentes por semelhança.

Rollback corretivo protegido em `supabase/rollback/legacy_place_search_completion.sql`; recusa desfazer cadastros já confirmados. A verificação em produção comprovou que `morere` e `Boipeba` retornam a indicação antiga, e que contagens/checksums dos oito lugares e doze relatos permaneceram iguais, com sete curtidas e três comentários. Não foi criada publicação ou localização de teste em produção.

Validação ampliada: 23 testes, build e Chromium em 320/390/768/1440 px, nos dois formulários, incluindo seleção antiga, campos editáveis, confirmação obrigatória e envio com ID central. Sem erros JavaScript/overflow. Dados simulados no navegador; a confirmação real fica a cargo do usuário.

## Remoção da confirmação obrigatória

A pedido do usuário, a caixa “Conferi município, UF e endereço” e sua exigência no servidor foram removidas dos formulários de Perfil e Comunidade. Migração aditiva `20261031030550_remove_legacy_location_confirmation.sql`, sem alterações em publicações existentes.

Para uma indicação antiga, endereço/referência preenchido é suficiente para continuar o fluxo de localização; município/UF incompletos não bloqueiam a publicação. Nome e relato seguem suas validações normais. Com município/UF válidos, o cadastro central ainda é reutilizado/criado. Sem esses dados, a nova experiência mantém a localidade histórica e permanece sem vínculo central, em vez de inventar um município ou cadastrar um lugar compartilhado incorreto. O álbum do Perfil segue compatível com o formato legado. Nenhuma alteração é aplicada ao relato original.

O endereço vazio é rejeitado na interface e no servidor. O estado de confirmação não é enviado nem exigido. Validação: 23 testes, build e Chromium nas quatro larguras, nos dois formulários, sem checkbox, com endereço vazio bloqueado e com endereço preenchido aceito sem município/UF. Consulta de verificação em produção confirmou o caminho sem checkbox, em transação desfeita, sem criar publicação de teste.
