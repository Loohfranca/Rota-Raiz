import { normalizeText } from "../lib/router.js";
export const TRAVEL_CITIES = [
  { id: "salvador", name: "Salvador", state: "BA", lat: -12.974, lng: -38.513 },
  {
    id: "joao-pessoa",
    name: "João Pessoa",
    state: "PB",
    lat: -7.1195,
    lng: -34.845,
  },
  {
    id: "rio-de-janeiro",
    name: "Rio de Janeiro",
    state: "RJ",
    lat: -22.9068,
    lng: -43.1729,
  },
];
// Airport reference points are for discovery, not the precise entrance/boarding gate.
export const AIRPORTS = [
  {
    id: "airport-bps",
    title: "Aeroporto de Porto Seguro (BPS)",
    aliases: ["BPS", "Aeroporto Porto Seguro"],
    location: "Porto Seguro, BA",
    lat: -16.4386,
    lng: -39.0809,
    address: "Aeroporto de Porto Seguro, Porto Seguro, Bahia, Brasil",
    source_url: "https://www.caraivabahia.com.br/comochegar.htm",
    access:
      "Para Caraíva, combine o transporte terrestre até Nova Caraíva e a canoa para a vila. Para Arraial, há conexão pelo terminal de balsas. Confira cada trecho do seu destino.",
  },
  {
    id: "airport-ssa",
    title: "Aeroporto de Salvador — Deputado Luís Eduardo Magalhães (SSA)",
    aliases: ["SSA", "Salvador Bahia Airport", "Aeroporto Salvador"],
    location: "Salvador, BA",
    lat: -12.914,
    lng: -38.335,
    address: "Salvador Bahia Airport, Salvador, Bahia, Brasil",
    source_url:
      "https://www.salvador-airport.com.br/index.php/pt-br/como-chegar-ao-aeroporto",
    access:
      "Há shuttle gratuito entre o terminal e a Estação Aeroporto da Linha 2 do metrô. A estação não fica dentro do terminal. Para a praia ou hospedagem, ainda será necessária a conexão adequada ao destino; não há metrô direto para toda a orla.",
  },
  {
    id: "airport-jpa",
    title: "Aeroporto de João Pessoa — Presidente Castro Pinto (JPA)",
    aliases: ["JPA", "Castro Pinto", "Aeroporto João Pessoa"],
    location: "Bayeux / João Pessoa, PB",
    lat: -7.1484,
    lng: -34.9507,
    address:
      "Aeroporto Internacional Presidente Castro Pinto, Bayeux, Paraíba, Brasil",
    source_url:
      "https://www.aenabrasil.com.br/pt/aeroportos/aeroporto-internacional-de-joao-pessoa-presidente-castro-pinto/Como-chegar.html",
    access:
      "O aeroporto fica em Bayeux. A Aena informa a linha intermunicipal 5601 — Aeroporto, com parada em frente ao terminal, Asa Sul. A grade publicada não garante uma saída para todo voo e não informa aqui um trajeto direto até cada praia. Consulte operação no dia e planeje a conexão para a orla; táxi e aplicativo são alternativas.",
  },
  {
    id: "airport-gig",
    title: "Aeroporto do Galeão — Tom Jobim (GIG)",
    aliases: ["GIG", "Galeão", "Tom Jobim", "RIOgaleão"],
    location: "Rio de Janeiro, RJ",
    lat: -22.8112,
    lng: -43.2586,
    address:
      "Aeroporto Internacional Tom Jobim, Galeão, Rio de Janeiro, Brasil",
    source_url:
      "https://transportes.prefeitura.rio/noticias/terminal-intermodal-gentileza-inicia-operacoes-em-dias-uteis-integrando-brt-vlt-e-onibus-municipais/",
    access:
      "A Prefeitura publica a conexão de ônibus executivo entre o Galeão e o Terminal Gentileza, onde há integração com outros transportes. Verifique tarifa, pagamento e operação atuais; a conexão até sua hospedagem ou praia depende do ponto escolhido.",
  },
  {
    id: "airport-sdu",
    title: "Aeroporto Santos Dumont (SDU)",
    aliases: ["SDU", "Santos Dumont"],
    location: "Rio de Janeiro, RJ",
    lat: -22.9105,
    lng: -43.1631,
    address: "Aeroporto Santos Dumont, Rio de Janeiro, Brasil",
    source_url:
      "https://www.gov.br/portos-e-aeroportos/pt-br/assuntos/noticias/2024/09/aeroporto-santos-dumont-rj-vai-receber-r-400-milhoes-em-investimentos-ate-2027",
    access:
      "Localizado na região central do Rio. Escolha sua origem ou destino para consultar o transporte público, carro ou caminhada até o terminal. Nenhuma linha ou tarifa foi selecionada automaticamente.",
  },
].map((item) => ({
  ...item,
  name: item.title,
  category: "Aeroporto",
  route_by_name: true,
  reviewed_at: "2026-10-22",
}));
const airportMeta = {
  "airport-bps": ["BPS", "porto-seguro"],
  "airport-ssa": ["SSA", "salvador"],
  "airport-jpa": ["JPA", "joao-pessoa"],
  "airport-gig": ["GIG", "rio-de-janeiro"],
  "airport-sdu": ["SDU", "rio-de-janeiro"],
};
AIRPORTS.forEach((a) => {
  [a.airport_code, a.served_city_id] = airportMeta[a.id];
});
export function airportText(point) {
  return normalizeText(point?.name || point?.title).replace(
    /\b(aeropoto|aerporto|aeroporo)\b/g,
    "aeroporto",
  );
}
const hasWord = (text, word) =>
  ` ${text.replace(/[^a-z0-9 ]/g, " ")} `.includes(` ${word} `);
export function airportCandidates(point) {
  const q = airportText(point);
  if (!q) return [];
  if (
    /^(rua|avenida|av|hotel|pousada|praia|restaurante)\b/.test(q) &&
    !/aeroporto|airport/.test(q)
  )
    return [];
  const direct = AIRPORTS.find(
    (a) =>
      point?.id === a.id ||
      point?.id === `place-${a.id}` ||
      point?.airport_code === a.airport_code ||
      q === normalizeText(a.title) ||
      a.aliases.some((alias) => {
        const n = normalizeText(alias);
        return n.length === 3
          ? hasWord(q, n)
          : q === n ||
              q.startsWith(`${n} `) ||
              (/aeroporto|airport/.test(q) && q.includes(n));
      }),
  );
  if (direct) return [direct];
  if (!/aeroporto|airport/.test(q) && point?.category !== "Aeroporto")
    return [];
  const cities = [
    ["rio-de-janeiro", ["rio de janeiro", "rio", "rj"]],
    ["porto-seguro", ["porto seguro", "bps"]],
    ["salvador", ["salvador", "ssa"]],
    ["joao-pessoa", ["joao pessoa", "bayeux", "jpa"]],
  ];
  const city = cities.find(([, names]) => names.some((n) => hasWord(q, n)));
  return city ? AIRPORTS.filter((a) => a.served_city_id === city[0]) : [];
}
export function matchAirport(point) {
  const matches = airportCandidates(point);
  return matches.length === 1 ? matches[0] : null;
}
