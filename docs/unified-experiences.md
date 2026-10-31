# Rota Raiz — Parte 2: lugares e experiências unificados

## Objetivo

Preparar o banco para que Perfil e Comunidade trabalhem sobre a mesma experiência, sem transformar cada aparição em uma publicação nova.

## Modelo

\`\`\`text
Lugar (rr_places)
  ├── nome, categoria, endereço, cidade, estado
  ├── Instagram e coordenadas confirmadas opcionais
  └── Experiências (community_recommendations)
        ├── autor, relato e data da visita
        ├── como chegar e dicas individuais
        ├── fotografias (rr_experience_photos)
        ├── curtidas (community_likes)
        └── comentários (community_comments)
\`\`\`

- \`rr_places\` é o cadastro central dos lugares indicados. Não reutiliza \`public.places\`, que continua sendo o catálogo curado de Explorar/rotas.
- \`community_recommendations.id\` permanece como ID da experiência e não é recriado. Curtidas e comentários continuam vinculados ao mesmo ID.
- Várias experiências de autores diferentes podem apontar para o mesmo \`place_id\`; os relatos nunca são fundidos.
- A experiência mantém data, relato, como chegar e dicas próprias.
- A tabela antiga \`rr_profile_cities\` e suas fotografias permanecem intactas. Sem endereço confirmado, o álbum antigo fica sem \`place_id\`.
- \`image_url\` permanece como referência de foto legada. Novas fotografias serão vinculadas diretamente à experiência em \`rr_experience_photos\`, com limite de duas e uma capa.
- \`rr_soft_delete_experience\` oculta sem apagar; \`rr_restore_experience\` permite recuperação pelo autor.

## Migração dos dados

A associação usa nome, endereço, cidade e estado normalizados. Acentos, caixa, prefixos comuns de logradouro e CEP final são tratados de forma determinística; endereço e número continuam compondo a identidade.

- Os IDs, autores, relatos, fotografias, curtidas e comentários existentes são preservados.
- Publicações distintas que apontam para a mesma identidade de lugar compartilham um cadastro central, mas continuam sendo experiências individuais.
- O estado só é separado da cidade quando já aparece explicitamente como sufixo de duas letras.
- Álbuns antigos do Perfil não são associados por aproximação: sem endereço confirmado, permanecem sem vínculo.
- \`rr_place_link_migration_map\` registra origem, ID antigo, destino e decisão.
- A migração é aditiva e idempotente.

## Segurança

- Leitura de lugares e fotos novas é limitada a registros ativos e aprovados.
- Escrita nas tabelas centrais é revogada para \`anon\` e \`authenticated\`; os fluxos futuros usarão funções \`SECURITY DEFINER\` com \`search_path\` vazio.
- \`rr_publish_experience\` exige autenticação, lugar válido, relato e data de visita não futura.
- \`rr_update_experience\` altera o conteúdo da experiência, não os dados compartilhados do lugar.
- Exclusão lógica e restauração validam a autoria.
- O banco limita as fotos a duas por experiência e uma capa.

## Aplicação e reversão

Esta etapa prepara os arquivos e as funções. Não aplica SQL no Supabase, não altera produção, não faz deploy e não muda telas.

Aplicação: executar \`migrations/20261030_unified_experiences.sql\` por uma pessoa administradora do projeto Supabase, após revisão e backup.

Reversão: \`migrations/20261030_unified_experiences_rollback.sql\` contém verificações impeditivas. Só remove a estrutura nova se não houver experiências novas, fotos novas, exclusões lógicas ou vínculos criados após a migração. Se existir qualquer dado novo, o rollback aborta sem alterar nada. Nesse caso, a reversão segura é voltar o código e manter as estruturas aditivas até exportar/reconciliar os dados.

## Fora do escopo

- Nenhuma tela, busca/autocomplete ou formulário foi alterado.
- Nenhuma animação da Parte 8 foi implementada.
- A Parte 4 conectará o formulário único às novas funções e à seleção de lugar.
- A Parte 6 usará \`place_id\` como agrupador canônico, mantendo as experiências individuais.
- A Parte 7 conectará a grade do Perfil à mesma experiência da Comunidade.
