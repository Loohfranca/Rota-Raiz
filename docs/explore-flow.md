# Explorar: descoberta primeiro

A cidade para explorar controla o catálogo e as dicas da comunidade. Inicializa pela região próxima da origem existente, quando disponível; depois fica independente de alterações da origem. A opção Perto do ponto de partida é explicitamente vinculada à origem. Trocar cidade limpa a busca e o filtro de categoria.

Ordem: inspiração fotográfica no início (preferência confirmada pelo usuário), título e Salvos, cidade, busca, categorias, resumo recolhível da origem, resultados com indicações da comunidade, busca externa recolhida. O formulário de origem só é montado quando aberto. Não pede GPS automaticamente. Abrir um salvo não troca a origem silenciosamente.

Categorias do catálogo são agrupadas em Praias, Alimentação e Passeios; seleções sem registros têm estado vazio e acesso externo, sem inventar lugares. A busca Maps fica no fim, usa a cidade selecionada e a categoria correspondente. Sem cidade específica, permite pesquisar outra cidade do Brasil. Resultados externos não são importados.

Verificação: testes de interface cobrem troca Rio → João Pessoa → Salvador, origem preservada, filtros, busca limpa, formulários recolhidos e destino correto dos links. Temas usam tokens existentes; conferência visual autenticada ainda pendente.

## Sugestões locais

Cidade e busca de lugares usam combobox com lista visível, toque e setas/Enter/Escape. Cidades são as regiões do catálogo, com correspondência sem acentos. Uma cidade só altera o catálogo depois de escolhida; ao sair do campo sem escolher, restaura a cidade selecionada. Lugares sugeridos respeitam cidade, categoria e salvos; escolher abre o detalhe. A busca externa livre também sugere regiões conhecidas, mas permite qualquer texto. Nenhuma digitação dispara geocodificação ou consulta Places. Isso não equivale a autocomplete de todos os endereços do Brasil.

## Comunidade integrada

Explorar consulta a mesma lista pública de indicações usada pela Comunidade ao abrir a tela, a cada 15 segundos enquanto visível e ao recuperar foco/conexão. Cidade, categoria e busca filtram os dois conjuntos. Alimentação aceita os registros antigos Comida e os novos Alimentação. Os grupos usam a mesma regra de nome/endereço/cidade da Comunidade. Não cria cópias nem supõe distâncias ou fotos que não existam.

Cards e sugestões de busca da comunidade abrem a aba Comunidade diretamente no detalhe da indicação original. Se o registro foi removido, a aba mostra aviso e mantém o feed navegável. A navegação não altera salvos ou publica experiências privadas. Respostas de comentários de um detalhe anterior são descartadas após trocar a indicação.
