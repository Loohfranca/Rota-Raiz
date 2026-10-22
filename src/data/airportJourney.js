import { normalizeText, haversineDistance } from '../lib/router.js';

export const AIRPORT_POINT = { name: 'Aeroporto de Porto Seguro (BPS)', source: 'local' };
export const CARAIVA_POINT = { name: 'Vila de Caraíva', stopId: 'stop-vila-caraiva', source: 'local' };

// Editorial research, not a live timetable or a quote from an operator.
export const JOURNEY_RESEARCH = {
  reviewedOn: '2026-10-22',
  sources: [
    'https://caraiva.com.br/como-chegar/',
    'https://www.caraivabahia.com.br/comochegar.htm',
    'https://travessiaportoseguro.com.br/',
    'https://portobahiaturismo.com.br/transfer-porto-seguro-caraiva/',
  ],
};
const isAirport = point => {
  const name = normalizeText(point?.name);
  return /\bbps\b/.test(name) || (name.includes('aeroporto') && name.includes('porto seguro'));
};
const isCaraiva = point => {
  const name = normalizeText(point?.name);
  // Don't confuse a nearby attraction with a departure from the village.
  if (/satu|espelho|corumbau/.test(name)) return false;
  if (name.includes('caraiva') && !/praia|rio/.test(name)) return true;
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng) &&
    haversineDistance(point.lat, point.lng, -16.8122, -39.1481) <= 2;
};
export function getAirportJourney(origin, destination) {
  const outbound = isCaraiva(origin) && isAirport(destination);
  const inbound = isAirport(origin) && isCaraiva(destination);
  if (!outbound && !inbound) return null;
  const village = outbound ? origin : destination;
  return { direction: outbound ? 'outbound' : 'inbound', mainland: normalizeText(village.name).includes('nova caraiva') };
}

const step = (mode, title, description, cost) => ({ mode, title, description, cost });
export function getJourneyOptions({ direction, mainland }) {
  const out = direction === 'outbound';
  const canoe = step('canoe', out ? 'Atravesse para Nova Caraíva' : 'Atravesse para a vila de Caraíva', out
    ? 'Vá da hospedagem ao embarque na beira do Rio Caraíva e pegue a canoa até Nova Caraíva. O veículo espera na outra margem.'
    : 'Desça em Nova Caraíva e atravesse o Rio Caraíva de canoa. Na vila, siga a pé pelas ruas de areia até a hospedagem.', 'Canoa: confirme tarifa e atendimento no embarque.');
  const ferry = step('ferry', out ? 'Balsa para Porto Seguro' : 'Balsa para Arraial d’Ajuda', out
    ? 'No terminal de Arraial, embarque como pedestre para atravessar o Rio Buranhém. Essa travessia é diferente da canoa de Caraíva.'
    : 'Embarque como pedestre no terminal de Porto Seguro e atravesse o Rio Buranhém. Procure o ponto da linha para Caraíva no lado de Arraial.', out ? 'Guias locais indicam gratuidade para pedestres neste sentido; confirme no terminal.' : 'Pedestres pagam neste sentido; consulte a tarifa no terminal.');
  const city = step('taxi', out ? 'Do terminal ao aeroporto' : 'Do aeroporto ao terminal de balsas', out
    ? 'Ao desembarcar em Porto Seguro, pegue um táxi até o terminal do Aeroporto de Porto Seguro (BPS). O ônibus de Caraíva não termina no aeroporto.'
    : 'Após desembarcar e retirar as malas, siga de táxi ao Terminal de Balsas de Porto Seguro. Não conte com um ônibus direto do aeroporto para Caraíva.', 'Táxi: valor separado, combinado antes do embarque.');
  const bus = step('bus', out ? 'Ônibus Nova Caraíva → Balsa de Arraial' : 'Ônibus Balsa de Arraial → Nova Caraíva', out
    ? 'No lado de Nova Caraíva, confirme o ponto e pegue a linha Balsa / Caraíva, da Viação Águia Azul, sentido balsa de Arraial d’Ajuda, via Trancoso. Desça no terminal de balsas.'
    : 'No terminal de Arraial, confirme o embarque da linha Balsa / Caraíva, da Viação Águia Azul, via Trancoso. Fique até Nova Caraíva, no acesso à travessia do rio.', 'Passagem por pessoa: tarifa atual ainda não confirmada.');
  const vehicle = step('taxi', out ? 'Encontre o motorista em Nova Caraíva' : 'Encontre o motorista no aeroporto', out
    ? 'Reserve táxi ou transfer para buscar você no acesso de Nova Caraíva e deixar no BPS. Combine o ponto exato, as malas e o horário antes de atravessar.'
    : 'Combine recepção no BPS e desembarque em Nova Caraíva. O carro não chega à porta da pousada dentro da vila.', 'Peça cotação: confirme se é por veículo ou passageiro e se inclui travessias.');
  const road = step('taxi', 'Combine o caminho por estrada', 'O serviço pode seguir pela balsa de Arraial ou pela ligação rodoviária da BR-367/BA-001, sem essa balsa. A canoa de Caraíva continua necessária para entrar ou sair da vila. Chuva, estrada de terra e filas alteram o tempo.', 'Confirme a rota e as taxas incluídas com o motorista.');
  const maybeCanoe = mainland ? [] : [canoe];
  return [
    { id: 'public', mode: 'bus', title: 'Ônibus + travessias', tag: 'Para economizar', summary: mainland ? 'Ônibus, balsa e táxi no trecho urbano.' : 'Canoa, ônibus, balsa e táxi no trecho urbano.', duration: 'Ônibus: referência de 2h40 a 3h30, além das conexões e esperas.', cost: 'Some passagem, canoa, eventual tarifa da balsa e táxi. Total ainda sem cotação.', steps: out ? [...maybeCanoe, bus, ferry, city] : [city, ferry, bus, ...maybeCanoe], schedule: out
      ? 'As referências divergem: primeira saída às 6h ou 6h20; também citam 16h. Há menção a extra de 11h na alta temporada. Não são horários confirmados para sua data.'
      : 'Guias locais citam 7h e 15h, com extras sazonais. Confirme a saída da balsa de Arraial para sua data; o pouso do voo não é o horário de embarque no ônibus.', actions: [{ label: 'Ligar para a Águia Azul', href: 'tel:+557335751170' }] },
    { id: 'private', mode: 'taxi', title: 'Táxi / transfer privativo', tag: 'Menos conexões', summary: 'Carro reservado e travessia de canoa combinada.', duration: 'Referência de cerca de 2h30; confirme o tempo total da sua saída.', cost: 'Sob cotação. Confira capacidade, bagagem, canoa e balsa no orçamento.', steps: out ? [...maybeCanoe, vehicle, road] : [vehicle, road, ...maybeCanoe], schedule: 'Reserve antes. Para voltar ao aeroporto, informe o horário do voo ao motorista e peça a previsão de saída com margem para a estrada e o check-in.', actions: [{ label: 'Consultar transfer', href: 'https://portobahiaturismo.com.br/transfer-porto-seguro-caraiva/' }] },
    { id: 'shared', mode: 'van', title: 'Van / transfer compartilhado', tag: 'Sob disponibilidade', summary: 'Divida o serviço quando houver saída e vaga confirmadas.', duration: 'Depende da saída combinada e dos embarques de outros passageiros.', cost: 'Peça o preço por pessoa e confira se inclui canoa e taxas.', steps: [step('van', 'Confirme a saída antes de contar com ela', 'Consulte uma agência local ou sua hospedagem. Pergunte data, vagas, embarque em Nova Caraíva ou no BPS, destino final e política para atraso do voo. Não há grade de van confirmada no app.', 'Não considere disponibilidade ou preço garantidos.'), ...(out ? [...maybeCanoe, vehicle] : [vehicle, ...maybeCanoe])], schedule: 'Sem reserva confirmada, tenha uma alternativa. Não suponha que a van saia a qualquer hora.', actions: [{label: 'Ver orientações de acesso', href: 'https://www.caraivabahia.com.br/comochegar.htm'}] },
    { id: 'car', mode: 'car', title: 'Carro próprio / alugado', tag: 'Por sua conta', summary: 'Estacionamento em Nova Caraíva e caminhada dentro da vila.', duration: 'O tempo varia com caminho escolhido, estrada, filas e devolução do carro.', cost: 'Inclua aluguel, combustível, estacionamento, canoa e balsa se utilizada.', steps: out ? [...maybeCanoe, step('car', 'Retire o carro no estacionamento', 'De Nova Caraíva, siga ao BPS pelo caminho planejado. Se for alugado, confirme onde devolver e como chegar ao terminal depois da entrega.', 'Reserve tempo para abastecer, vistoria e devolução.')] : [step('car', 'Retire o carro e siga a Nova Caraíva', 'Combine com a locadora as condições da estrada de terra. Ao chegar, deixe o carro em estacionamento do lado de Nova Caraíva; ele não entra nas ruas da vila.', 'Confirme diária do estacionamento e taxas do caminho.'), ...maybeCanoe], schedule: 'Há trajeto via balsa de Arraial e alternativa rodoviária sem essa balsa. Compare o caminho do dia antes de sair.', actions: [] },
  ];
}
