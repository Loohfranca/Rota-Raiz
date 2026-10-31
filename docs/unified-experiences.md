# Rota Raiz — Parte 2: lugares e experiências unificados

## Modelo central

\`\`\`text
rr_places (cadastro único do lugar)
  └── community_recommendations (experiência individual, autor, relato e visita)
        ├── rr_experience_photos (duas fotos, uma capa)
        ├── community_likes (curtidas)
        └── community_comments (comentários)
\`\`\`

- Cada experiência conserva seu ID. Perfil e Comunidade deverão consultar a mesma experiência.
- Várias experiências podem apontar para o mesmo \`place_id\`, sem fundir relatos.
- O catálogo curado \`public.places\` usado em Explorar/rotas não é alterado.
- Álbuns antigos do Perfil permanecem em \`rr_profile_cities\` e \`rr_profile_photos\`. Sem endereço e UF confirmados, não recebem vínculo presumido.
- Fotos antigas e \`image_url\` não são apagados nem movidos. Curtidas e comentários existentes mantêm o mesmo \`recommendation_id\`.
- Novas fotos são vinculadas diretamente à experiência, com limite de duas e uma capa.
- Exclusão lógica preserva a experiência e suas relações para restauração.

## Backfill conservador

A identidade central exige nome, endereço, município e UF. A UF é extraída do sufixo da cidade ou do endereço quando há uma sigla brasileira inequívoca. Registros como "Moreré / Bahia / Ilha de Boipeba", sem município/UF confirmados, permanecem sem vínculo; não se transforma o nome de um estado em município.

A associação exige nome, endereço, cidade e estado normalizados. Não há fusão de experiências nem aproximação difusa. Cada decisão é registrada em \`rr_place_link_migration_map\`.

## Fotos e segurança

- Upload usa o bucket público já existente \`community-photos\`, respeitando as políticas e limites atuais.
- \`rr_add_experience_photos\` exige exatamente dois objetos enviados pela conta autenticada e uma única capa.
- \`rr_publish_experience\` grava lugar, experiência e as duas fotos em uma única transação.
- Escrita direta nas tabelas centrais é revogada; funções autorizadas validam autoria.
- Exclusão lógica e restauração preservam curtidas, comentários e fotos.

## Aplicação

Migração: \`supabase/migrations/20261030220000_unified_experiences.sql\`.

Rollback protegido: \`supabase/rollback/20261030_unified_experiences_rollback.sql\`. O script aborta se detectar experiências/fotos novas, exclusões lógicas, lugares criados por usuários ou vínculos novos. Não usar rollback como rotina.

Esta parte não altera telas, não implementa busca, formulário, GPS ou layout do Perfil. Essas integrações pertencem às Partes 3 a 8.
