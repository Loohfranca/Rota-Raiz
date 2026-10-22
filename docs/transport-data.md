# Transporte: cobertura e atualização

## Origem e destino livres — correção em 22/10/2026

Não há atalhos ou preenchimento automático de Caraíva/aeroporto na tela. O viajante escolhe os dois pontos; a origem anteriormente escolhida pode ser lembrada como nos demais fluxos. Não existem mais sugestões iniciais limitadas às cidades da Bahia.

O conteúdo pesquisado de Caraíva só é usado quando os pontos escolhidos correspondem ao trajeto. Fora da cobertura interna, a UI identifica a ausência de roteiro verificado e oferece consulta externa pelo Google Maps com origem/destino reais e preferência por transporte público, carro ou caminhada. Isso NÃO é integração com Google Routes API, nem cobertura nacional interna concluída. Não há inventário nacional de ônibus, canoas ou táxis.

Busca de endereço no Nominatim público agora depende de ação explícita na lupa/Enter, sem consultas enquanto o usuário digita. Texto digitado também pode ser enviado à consulta externa, sem exigir que um endereço exista no nosso banco. Endereços completos selecionados são preservados para evitar confundir lugares homônimos. Fonte: https://developers.google.com/maps/documentation/urls/get-started e https://operations.osmfoundation.org/policies/nominatim/.

## Implementado em 22/10/2026

A aba Como chegar reconhece Caraíva ↔ Aeroporto de Porto Seguro (BPS), inclusive a hospedagem em Caraíva, por nome ou coordenadas próximas à vila. Os atalhos usam explicitamente a vila; Nova Caraíva dispensa a etapa de canoa. Isso é um roteiro editorial de acessos, não um cálculo com disponibilidade, cotações ou tabela operacional em tempo real. Outras rotas continuam usando o grafo cadastrado.

Quatro alternativas recolhíveis: ônibus e conexões, transfer/táxi, compartilhado sob confirmação e carro. A alternativa pública inclui canoa, linha Nova Caraíva–balsa de Arraial, travessia do Buranhém e táxi entre o terminal de Porto Seguro e o BPS. Não há evidência suficiente para nomear um ônibus urbano no último trecho.

Preços não confirmados permanecem desconhecidos. Não somar como zero ou mostrar “Grátis”. Os 2h40–3h30 são referências publicadas para o ônibus e não promessa de duração porta a porta. Transfer: referência aproximada de 2h30, a confirmar na cotação. Nenhum km novo foi inferido de distância em linha reta.

## Evidências consultadas

- https://caraiva.com.br/como-chegar/ — canoa, táxis e linha da Águia Azul; contato publicado (73) 3575-1170. Horários publicados: 7h/15h saindo de Arraial e 6h20/16h de Caraíva. A tarifa antiga de R$20 não foi adotada como atual.
- https://www.caraivabahia.com.br/comochegar.htm — acesso terrestre a Nova Caraíva, restrição de veículos na vila, opções de ônibus/vans; primeira saída de Caraíva às 6h diverge da referência acima. Extras são sazonais.
- https://travessiaportoseguro.com.br/ — operação publicada das balsas; intervalos variam com período/fluxo. Não calculamos conexão de voo a partir de frequência média.
- https://portobahiaturismo.com.br/transfer-porto-seguro-caraiva/ — operador publica caminhos via balsa ou BR-367/BA-001; valor mediante consulta.
- https://moovitapp.com/index/pt-br/transporte_p%C3%BAblico-line-balsa_cara%C3%8Dva-Porto_Seguro-5622-1292968-1329864-1 — corrobora sentido e terminal da linha.

O site indicado da própria Águia Azul não pôde ser consultado (502). Portanto as saídas e tarifas NÃO foram marcadas como confirmadas pelo operador. Não há reserva, contato enviado ou contratação neste fluxo.

## Próxima integração: decisão técnica proposta, ainda não executada

1. Guardar trechos e evidências por sentido, operador e data: ponto de embarque/desembarque, modo, dias de operação, intervalo de validade, preço por pessoa/veículo, moeda, taxas incluídas, URL, data da consulta e estado de verificação. Valores desconhecidos são `null`.
2. Consultar operadores e dados GTFS licenciados quando publicados. GTFS é um formato de dados; sua existência não garante cobertura de canoas ou vans locais.
3. Google Routes API TRANSIT pode complementar onde há cobertura; verificar trajetos reais antes de integrar. Uma resposta sem tarifa completa não deve virar preço zero. Chave apenas no servidor.
4. IA pode extrair mudanças de fontes autorizadas para propostas estruturadas. Comparar com a versão atual e submeter divergências de preço/horário a revisão. Não publicar automaticamente uma resposta textual como fato operacional.
5. Reusar nossos dados editoriais por trecho e sentido com validade e revisão. Cache de dados de terceiros deve seguir o contrato da fonte. A política de Google Routes restringe armazenamento da maior parte das respostas e impõe condições ao mapa e à atribuição: não armazenar indefinidamente nem desenhar automaticamente uma resposta Google no Leaflet atual.
6. Aplicar limites de chamadas no servidor e cotas no provedor. Orçamento/alerta de faturamento não é um bloqueio de gastos. Nenhum serviço pago ou rotina automática foi ativado neste patch.

Documentação técnica consultada:
- https://developers.google.com/maps/documentation/routes/transit-route
- https://developers.google.com/maps/documentation/routes/policies
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://ai.google.dev/gemini-api/docs/pricing

Preços consultados: Routes Compute Routes Essentials, 10.000 eventos gratuitos/mês e US$5/1.000 na primeira faixa paga. Recursos Pro/Enterprise e outros SKUs mudam a conta. Exemplo isolado: 15.000 requisições Essentials/mês = US$25 além da franquia, sem outros serviços/impostos/câmbio. Gemini Flash-Lite: entrada US$0,10 e saída US$0,40 por milhão de tokens na tabela Standard; grounding/busca tem franquias e cobrança próprias. Nada disso comprova cobertura de transporte em Caraíva.
