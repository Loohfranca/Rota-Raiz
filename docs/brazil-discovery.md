# Trancoso e descoberta no Brasil — 26/10/2026

Trancoso passou a ser região própria no Explorar, com seis entradas pesquisadas: Quadrado, praias dos Nativos, Coqueiros, Rio Verde, Rio da Barra e Itapororoca. O centro de referência da região usa a cidade já cadastrada no projeto; os lugares sem pino conferido são localizados pelo nome e endereço, sem distância inventada.

As referências ficam em src/data/trancosoPlaces.js. Foram consultados Visit Brasil, Visit Porto Seguro, Trancoso Guide, Melhores Destinos e Itapororoca Trancoso. Os textos identificam acessos por terra ou costa e cuidados com maré, rios e propriedades privadas. Não há preços ou horários inventados. A galeria existente do Quadrado continua disponível; fotos genéricas não foram adicionadas às praias.

Para o restante do Brasil, a escolha confirmada foi consultar no Maps. O novo painel permite informar cidade/região e escolher pontos turísticos, praias, parques, cachoeiras ou museus. Gera somente Maps URLs: não consulta APIs nem acrescenta chaves, cadastro ou cobrança por pesquisa. Não há consulta automática enquanto digita. O resultado é aberto no Google Maps e não é importado para o catálogo próprio. Cobertura depende do destino e da categoria.

Documentação da integração: https://developers.google.com/maps/documentation/urls/get-started .

Validação: 26 testes passaram, incluindo filtros de Trancoso, busca nacional por categoria, codificação dos nomes, nenhum pedido de rede ao digitar e a tela Explorar com os seis lugares. Build passou e lint sem erros (há avisos existentes). A conferência visual autenticada continua pendente, pois o navegador disponível abre a tela de login do app.
