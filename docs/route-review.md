# Revisão do fluxo Como ir — 26/10/2026

## Problemas corrigidos

- O painel mostrava quatro modos fixos para qualquer percurso. Agora sugere avião e transporte por terra em viagens longas ou entre aeroportos conhecidos de cidades diferentes. Caminhada e bicicleta ficam fora das sugestões iniciais desses casos. Outros meios podem ser escolhidos explicitamente em Outras formas de ir.
- O voo é uma busca própria no Google por origem/destino, com códigos IATA quando reconhecidos; não usa um travelmode inexistente do Maps. Datas, preços, disponibilidade e conexões são conferidos externamente. Não há API de passagens ou cobrança adicionada. Google Voos não tem consulta ao vivo integrada ao Rota Raiz.
- Aeroporto do Rio oferece Galeão e Santos Dumont; o link fica bloqueado até escolher. Reconhecimento aceita códigos e nomes com preposições, sem confundir Rua Santos Dumont ou Hotel Galeão com o aeroporto.
- Acesso local ao terminal é tratado separadamente do voo. Transferência GIG/SDU permanece terrestre por padrão. A consulta a acessos dos aeroportos cadastrados fica recolhida no painel do voo.
- Origem e destino iguais são bloqueados, inclusive apelidos do mesmo aeroporto e coordenadas idênticas.
- Uma resposta atrasada do GPS não pode mais substituir uma origem editada ou invertida. Pedidos são invalidados também ao desmontar a tela.
- A confirmação do aeroporto também atualiza o campo do formulário, evitando repetir a escolha.
- Ao trocar os pontos, o painel descarta a seleção anterior. Falha no carregamento de roteiros locais informa que a consulta externa continua disponível. Inverter e editar limpa erros/resultados antigos.

## Design e limites

O painel usa identificação de viagem, seleção destacada de avião, esclarecimento de aeroporto ambíguo, uma ação principal correspondente ao meio escolhido e acessos secundários recolhidos. Mantém as cores e os controles de toque da rota-raiz-design.

A escolha automática é uma regra de interface, não uma previsão de viabilidade. Usa os aeroportos e as cidades cadastrados, ou coordenadas selecionadas, como referências. Distâncias para classificar o contexto são em linha reta e não são exibidas como percurso. Nomes sem localização conhecida podem exigir Buscar no mapa ou escolha manual em Outras formas de ir. Não é reconhecimento universal de aeroportos nem uma afirmação de que exista voo entre os pontos. Os acessos publicados antes não tiveram linhas/preços revalidados nesta revisão.

## Validação

37 testes passaram. Os novos cenários cobrem GIG/BPS, Rio ambíguo, SDU/GIG, acesso local ao SDU, códigos IATA, nomes de rua, mesmo aeroporto por aliases, pesquisa por cidades, troca de contexto e GPS atrasado. Mantidas regressões de comunidade, caminhada com mapa, catálogo, descoberta nacional, divisão e PDF. Build e lint executados.

Esta revisão cobriu o fluxo Como ir, reconhecimento de aeroportos, links externos, estado de formulário e as regressões automatizadas dos demais módulos. Não representa auditoria integral de segurança, carga ou operação de todos os serviços externos. O navegador foi encaminhado ao login Google; a conferência visual autenticada depende dessa sessão.

Referências oficiais: https://developers.google.com/maps/documentation/urls/get-started ; https://support.google.com/travel/answer/2475306?hl=pt-BR .
