# Parte 5 — localização confirmada de lugares

Implementada sobre a Parte 4, sem alteração de publicação, Perfil, Comunidade ou dados históricos. Publicação autorizada após validação. Migração aplicada em produção sem alterar os oito lugares e as 13 experiências existentes.

## Fluxo

No cadastro de um novo lugar, `Usar minha localização atual` chama uma única vez `getCurrentPosition` (timeout 15 s, sem posição antiga e sem rastreamento). O ponto fica somente no estado temporário do componente. O mapa Leaflet permite mover, clicar, arrastar o marcador e navegar por teclado. Cada mudança invalida a sugestão anterior; respostas atrasadas são ignoradas.

`Conferir este ponto` consulta endereço e lugares internos próximos em paralelo. Não há consulta automática ao arrastar. Município e UF, mais endereço ou referência, são exigidos para confirmar esse método de preenchimento. Sem rua, a referência e as coordenadas são preservadas, sem inventar rua/número. Não é copiado o nome de estabelecimento que o geocodificador eventualmente retornar.

`Confirmar localização do novo lugar` copia os dados para o formulário, sem publicar. Selecionar um lugar próximo recupera o cadastro completo existente e usa o mesmo fluxo protegido da Parte 4. Cancelar, negar GPS ou ter falha de rede mantém o preenchimento manual e a pesquisa interna disponíveis. Não há checkbox adicional.

## Dados e segurança

Migração: `20261031040314_confirmed_place_nearby.sql`. Adiciona apenas índice parcial em `rr_places(lat,lng)` e RPC `rr_nearby_places`. SECURITY INVOKER, search_path fixo, autenticação obrigatória, sem EXECUTE para PUBLIC/anon. Mantém RLS, calcula distância esférica após bounding box e retorna até oito lugares ativos num raio de 1,5 km. A distância é em linha reta e não prova identidade. Nenhum lugar é criado, alterado ou fundido nessa consulta. Reversão remove apenas função e índice.

Coordenadas não são persistidas por esse fluxo até a publicação explícita pelo serviço existente da Parte 4. GPS pessoal não é salvo automaticamente. Nenhuma nova tabela, permissão de escrita, storage ou rastreamento.

## Provedores

Mapa: tiles OpenStreetMap, com atribuição preservada. Endereço: Photon/Komoot (`https://photon.komoot.io/reverse`), consulta explícita limitada a 200 m, limite 1, cache somente em memória (até 100 entradas), fila espaçada e timeout. `VITE_PLACE_REVERSE_URL` permite endpoint Photon compatível alternativo HTTPS. O serviço público Photon admite uso moderado, sem garantia de disponibilidade; falhas não impedem entrada manual. Referências: https://github.com/komoot/photon e https://github.com/komoot/photon/blob/master/docs/api-v1.md.

A interface informa que os provedores recebem o ponto; não importa resultados externos como lugares do banco interno. O serviço público Nominatim não foi adicionado ao novo fluxo.

## Validação

56 testes automatizados passaram, incluindo GPS negado/ausente/timeout, coordenadas inválidas, sugestão sem inventar estabelecimento, confirmação explícita sem checkbox, cancelamento, seleção de lugar existente, falhas independentes e resposta atrasada. Banco local PGlite: limite/raio/ordenação, exclusão lógica, invalidação de coordenadas, acesso anônimo recusado, reversão e preservação da quantidade de registros.

Build passou. Navegador Chromium com mapa Leaflet real e GPS/resposta de endereço controlados: 320, 390, 768 e 1440 px, confirmação, seleção existente, sem overflow nem erros de JavaScript. A cartografia externa não carregou neste ambiente; implementado estado explícito de falha de tiles. Separadamente, consulta real Photon de coordenada pública em Copacabana retornou HTTP 200 e endereço/cidade/UF válidos. Não foram usados localização pessoal, login ou dados reais de usuários nos testes.
