# Minhas viagens

Roteiros pessoais separados do financeiro em Na conta. Cada viagem reúne trechos e lugares; o usuário marca explicitamente o que foi realizado ou visitado.

## Fluxos

- Criar/renomear uma viagem; selecionar a viagem ativa.
- Cadastrar de um a oito percursos em um trecho (até sete paradas), com origem, destino, saída, chegada e fusos IANA. Companhia e comentário são opcionais. Avião, ônibus, carro/táxi, barco/canoa, caminhada, bicicleta e outros.
- Datas completas permitem chegadas no dia seguinte. A duração total e a espera de cada conexão usam instantes reais. Horários inexistentes ou ambíguos em transições de horário de verão são rejeitados, em vez de escolher um instante silenciosamente.
- Ao salvar no Explorar ou no detalhe, uma viagem única recebe o lugar automaticamente. Sem viagem, o usuário cria uma; com várias, escolhe a viagem em uma folha compacta, com a última seleção pré-selecionada.
- O lugar entra como Quero ir, sem data e sem comentário. Já fui, data e comentário são escolhas explícitas. Salvos anteriores podem ser adicionados pelo botão Adicionar à viagem no detalhe; não são enviados automaticamente à nuvem. Remover dos salvos não apaga o roteiro; remover um registro do roteiro não apaga os salvos.
- PDF próprio para o roteiro: trechos em ordem de partida, situação planejado/realizado, conexões, comentários, lugares visitados e lugares planejados. Linhas e aviões ilustram a sequência; não são mapas navegáveis ou rotas calculadas.

## Persistência e acesso

Tabela travel_itineraries com RLS por owner_id = auth.uid(), sem acesso anônimo, e apenas SELECT/INSERT/UPDATE para authenticated. Não há SECURITY DEFINER novo. Trigger invoker valida formato, limites e cronologia dos percursos, impede transferência de propriedade e incrementa a versão. Atualizações condicionadas à versão rejeitam edição antiga, evitando sobrescrever mudanças de outra janela.

Sem API paga, consulta de voos, geocodificação ou importação de bilhetes. Os horários são inseridos pelo usuário. Não há envio de gastos para essa área. O corpo do roteiro fica na conta; apenas a preferência da viagem selecionada é guardada na sessão do navegador. O salvamento exige conexão e uma falha mantém os formulários abertos.

## Validação

Testes de modelo, banco local com RLS, interface, integração com Salvar e PDF cobrem conexões noturnas, diferenças de fuso, horários ambíguos, estados planejado/visitado, comentários e falhas de salvamento. Teste no banco real com usuários sintéticos confirmou criação, visita planejada, versão concorrente e isolamento; ROLLBACK removeu os registros de teste.

PDF de amostra renderizado e revisado em duas páginas, inclusive cabeçalho, avião ilustrativo e separação entre visitados e planos. A interface autenticada ainda depende de revisão visual após login: o navegador remoto não acessa a prévia local. Nenhuma rota pública de bypass foi adicionada.
