# Parte 4 — Formulário único publicado

Base de publicação: `b40a8b6`, sobre a estrutura `rr_places` / `community_recommendations` / `rr_experience_photos` já em produção. A implementação local antiga da Parte 4 foi adaptada; não foram aplicadas suas tabelas alternativas ou as Partes 5–6.

## Funcionamento

Perfil e Comunidade abrem o mesmo `ExperienceForm` e usam o mesmo `createExperiencePublication` / `experiencePublication`. A busca interna precede os campos. Ao escolher um lugar existente, nome, categoria, endereço/cidade/UF e Instagram cadastrado ficam protegidos; Instagram ausente pode ser acrescentado com validação e controle de versão. Estado ausente em um cadastro central antigo pode ser complementado.

Nova publicação exige data válida e não futura, relato de até 500 caracteres, duas fotografias distintas e seleção explícita de uma capa. Como chegar é separado em ponto de partida/transporte/trajeto; dicas também são opcionais. O mapa/GPS e a jornada premium não fazem parte desta publicação.

Novo lugar postal exige nome, categoria, endereço, município e UF. Praia sem endereço postal aceita latitude/longitude e referência geográfica; não inventa rua ou número. A referência fica em campo próprio. O campo de compatibilidade textual guarda “Ponto confirmado: lat, lng”; o formulário recebe `address: null` e os dados geográficos reais. Destinos podem ser associados sem duplicar o catálogo de lugares.

Conforme a orientação posterior do usuário, **não há caixa de confirmação de localização**. Indicações antigas incompletas, como Moreré, continuam podendo publicar uma nova experiência com o endereço/referência existente sem município/UF completos. Nesse caso, a localidade histórica é preservada, sem inventar município nem criar um lugar central incorreto. Data, relato, duas fotos e capa continuam obrigatórios para essa nova experiência.

## Uma gravação, duas interfaces

O formulário grava uma única publicação por UUID. O Perfil projeta essas mesmas experiências e fotografias na grade atual; não cria outro álbum ou copia imagens. A Comunidade recebe a publicação original. Edição atualiza esse UUID e conserva IDs das fotos mantidas. A capa muda sem reenviar arquivos antigos. Os cards e o grid existentes são preservados; o detalhe oferece navegação manual entre as duas fotos e mostra data/Como chegar/dicas quando informados.

Todas as ações de nova publicação do Perfil abrem o compositor compartilhado, incluindo “Adicionar fotos”. Álbuns e fotografias históricos continuam listados; não foram convertidos nem associados por aproximação. A grade e os links atuais do Perfil permanecem. A jornada específica da Parte 7 não foi implementada antecipadamente.

## Banco, permissões e preservação

Migração aplicada: `supabase/migrations/20261031033649_shared_experience_form.sql` (versão alinhada ao Supabase). Reutiliza as tabelas e o bucket `community-photos` existentes. Acrescenta versão/referência/tipo de localização ao lugar e metadados de formulário/idempotência à publicação.

- `rr_save_experience_form` valida autenticação, autoria, versão, dados do lugar, data, texto, opções, duas fotos e capa em uma transação.
- As fotografias precisam existir no armazenamento, pertencer à conta e estar no bucket correto. Não podem pertencer a outra experiência.
- `rr_get_own_experience` consulta somente a publicação do usuário autenticado, inclusive para conferir resultado após falha de rede.
- `rr_edit_legacy_experience` permite editar relato/opções antigos sem exigir retroativamente data ou duas fotos.
- `rr_set_experience_deleted` realiza exclusão lógica com autoria/versão, preservando relações e metadados. A interface confirma antes de remover.
- Triggers diferidos garantem data válida, duas fotos e uma capa nas publicações v2 ativas, inclusive após editar.
- APIs antigas de gravação incompleta foram retiradas do acesso autenticado; leitura, curtidas, comentários, moderação e dados antigos foram conservados. As novas funções têm `search_path` fixo, EXECUTE restrito e verificam o usuário no servidor. Tabelas centrais continuam sem INSERT/UPDATE direto para usuários.
- A busca prioriza o cadastro central quando ele e uma indicação histórica incompleta têm a mesma relevância. Nenhuma indicação antiga é fundida automaticamente.

Rollback em `supabase/rollback/shared_experience_form.sql`: recusa remover dados novos e foi testado em base limpa, preservando a Parte 2/3 e permitindo reaplicar. Após adoção, preferir rollback do frontend ou correção aditiva.

## Uploads e conexão

O mesmo serviço comprime as duas fotos antes do primeiro upload. Erro definitivo remove somente arquivos novos daquela tentativa; não apaga fotos antigas. Falha de resposta após commit é conferida pelo UUID/token, data, relato, opções, caminhos e capa. Resultado ambíguo mantém o formulário bloqueado e oferece “Conferir envio”, reutilizando os mesmos arquivos e identificador. Esse estado é mantido na sessão aberta, não é uma fila durável após fechar a aba.

Os limites atuais de Storage continuam valendo, inclusive a cota preventiva do bucket comunitário. A guarda de galeria soma metadados históricos e novos, mas não promete ampliar cotas. Não houve remoção de objetos órfãos nem alteração de bucket/publicidade das imagens.

## Validação

- **46 testes passaram**: migrações publicadas anteriores, busca, formulário, validações, serviço, retry, SQL, autoria, concorrência, fotos retidas, legado, reversão protegida e reaplicação limpa.
- Chromium local em 320, 390, 768 e 1440 px: componentes reais e serviço real, com RPCs executadas contra PGlite e uploads/arquivos locais simulados. Publicação pelo Perfil → leitura na Comunidade; edição de relato e capa → atualização nas duas telas; publicação pela Comunidade → duas fotos no Perfil. Duas publicações, quatro fotos, quatro uploads; edição sem upload extra. Sem erros JavaScript ou overflow, inclusive com a lista expandida. Uma imagem de entrada tinha MIME vazio e foi compactada pelo otimizador real.
- Build Vite passou. Lint executado com avisos de hooks/estado e outros avisos existentes; não é uma validação sem avisos. O aviso de chunks grandes continua.
- Não houve login, upload ou publicação sintética em produção.
- Antes/depois do SQL: oito lugares, treze indicações, quatro álbuns históricos, sete curtidas e três comentários; zero metadados de fotos canônicas ou do Perfil nessa verificação. Checksums dos campos existentes de lugares e publicações ficaram idênticos. Nenhum relato, foto ou interação existente foi alterado pela migração.
- Permissões verificadas em produção: autenticados executam o novo serviço; anônimos não; a gravação legada incompleta está desativada. Advisors de segurança consultados antes/depois. Os avisos gerais preexistentes de Auth e tabelas privadas não foram alterados nesta etapa.
