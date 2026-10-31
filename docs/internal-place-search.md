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
