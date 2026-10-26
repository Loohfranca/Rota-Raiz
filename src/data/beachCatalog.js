import tripPlaces from './tripPlaces.json';
import { TRANCOSO_PLACES } from './trancosoPlaces.js';
import { CARAIVA_BEACHES } from './caraivaBeaches.js';
import { BEACH_GUIDES } from './beachGuides.js';
// Catálogo pesquisado em 21/10/2026. Coordenadas são referências, não garantia de acesso.
export const BEACHES = [
  {
    "id": "caraiva-praia",
    "title": "Praia de Caraíva",
    "region": "caraiva",
    "city_id": "caraiva",
    "location": "Caraíva, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.8102224,
    "lng": -39.1454188,
    "subtitle": "A praia da vila, com caminhos de areia e presença Pataxó.",
    "history": "A vida entre rio e mar e a presença Pataxó fazem parte da identidade local. Ao sul, a orla segue para Xandó e Pedra do Negro.",
    "tide_note": "Na maré baixa há piscinas em trechos de Xandó; observe ondas e recifes.",
    "access_note": "Saia pelas ruas de areia da vila em direção à orla. O ponto indica um trecho da praia.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.caraivabahia.com.br/passeios.htm"
      },
      {
        "title": "Fonte do guia",
        "url": "https://www.gov.br/icmbio/pt-br/assuntos/biodiversidade/unidade-de-conservacao/unidades-de-biomas/mata-atlantica/lista-de-ucs/parna-e-historico-do-monte-pascoal/informacoes-sobre-visitacao-parna-e-historico-do-monte-pascoal/etnoturismo"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/way/210584506",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "satu",
    "title": "Praia do Satu",
    "region": "caraiva",
    "city_id": "caraiva",
    "location": "Caraíva, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.770989,
    "lng": -39.1408726,
    "subtitle": "Lagoas e recifes ao norte do Rio Caraíva.",
    "history": "Integra o litoral entre Caraíva e Trancoso, protegido por uma APA criada em 1993.",
    "tide_note": "A passagem pela areia depende da maré. Confira ida e retorno com moradores.",
    "access_note": "Saindo da vila, a opção costeira começa com travessia de canoa; depois segue pela praia. Não atravesse o rio a nado.",
    "requires_crossing_from_caraiva": true,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.caraivabahia.com.br/passeios.htm"
      },
      {
        "title": "Fonte do guia",
        "url": "https://www.ba.gov.br/inema/gestao-2/unidades-de-conservacao/apa/apa-caraiva-trancoso"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/node/8398243700",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "espelho",
    "title": "Praia do Espelho",
    "region": "caraiva",
    "city_id": "caraiva",
    "location": "Caraíva, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.7257868,
    "lng": -39.1224566,
    "subtitle": "Recifes e falésias no litoral de Curuípe.",
    "history": "É um dos atrativos da APA Caraíva–Trancoso, criada para proteger os ambientes costeiros.",
    "tide_note": "Trechos junto às falésias podem perder passagem na maré alta.",
    "access_note": "Desde Caraíva, o trajeto costeiro envolve canoa, praia e trilhas. Consulte um guia local para os acessos.",
    "requires_crossing_from_caraiva": true,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.caraivabahia.com.br/passeios.htm"
      },
      {
        "title": "Fonte do guia",
        "url": "https://www.ba.gov.br/inema/gestao-2/unidades-de-conservacao/apa/apa-caraiva-trancoso"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/relation/17976625",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "apaga-fogo",
    "title": "Praia do Apaga Fogo",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.4622567,
    "lng": -39.0608709,
    "subtitle": "A primeira praia depois da balsa.",
    "history": "A proximidade da travessia do Buranhém marca sua ligação com Porto Seguro.",
    "tide_note": "Recifes ficam expostos na maré baixa.",
    "access_note": "Pelo lado de Arraial, siga os acessos locais à praia. Desde Porto Seguro há travessia de balsa.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/way/399001040",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "aracaipe",
    "title": "Praia de Araçaípe",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.4741281,
    "lng": -39.0623749,
    "subtitle": "Trecho de orla entre a balsa e o centro.",
    "history": "Faz parte da sequência de praias ao norte do centrinho de Arraial.",
    "tide_note": "O mar pode ficar mais forte na cheia.",
    "access_note": "Procure um acesso público pela Estrada da Balsa.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/way/399001038",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "pescadores",
    "title": "Praia dos Pescadores",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.4858475,
    "lng": -39.0675835,
    "subtitle": "Também chamada Praia do Delegado.",
    "history": "Os dois nomes identificam esse trecho próximo ao Eco Parque.",
    "tide_note": "Observe pedras e recifes descobertos.",
    "access_note": "Use os acessos públicos próximos ao Eco Parque.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/way/399001043",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "mucuge",
    "title": "Praia do Mucugê",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.4968765,
    "lng": -39.0700458,
    "subtitle": "Praia ligada ao centrinho pela ladeira.",
    "history": "O acesso pelo centro ajudou a concentrar barracas e comércio na orla.",
    "tide_note": "Consulte a maré antes de explorar recifes.",
    "access_note": "Desde o centro, desça a Rua do Mucugê até o acesso à praia.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/node/12142271565",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "parracho",
    "title": "Praia do Parracho",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.5032648,
    "lng": -39.0716176,
    "subtitle": "Orla conhecida pelos bares e restaurantes.",
    "history": "O lazer à beira-mar é parte da identidade turística desse trecho.",
    "tide_note": "Confira a faixa de areia disponível.",
    "access_note": "Use os acessos públicos da orla; não presuma passagem por estabelecimentos privados.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/way/399001042",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "pitinga",
    "title": "Praia da Pitinga",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.5124635,
    "lng": -39.0738695,
    "subtitle": "Falésias e paisagem costeira.",
    "history": "As falésias são a marca natural do trecho ao sul de Arraial.",
    "tide_note": "A faixa de areia varia com a maré.",
    "access_note": "Siga os acessos da Pitinga. Mantenha distância da base e da borda das falésias.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/way/399001039",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "taipe",
    "title": "Praia de Taípe",
    "region": "arraial-dajuda",
    "city_id": "arraial-dajuda",
    "location": "Arraial d’Ajuda, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.5277348,
    "lng": -39.0869186,
    "subtitle": "Falésias e trecho afastado do centro.",
    "history": "A paisagem de falésias destaca essa parte do litoral de Arraial.",
    "tide_note": "Pode haver ondas fortes; avalie o mar no dia.",
    "access_note": "Confirme o acesso público disponível. O percurso depende do ponto de chegada escolhido.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://www.arraialdajudabahia.com.br/praias"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/node/12142271698",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "mundai",
    "title": "Praia de Mundaí",
    "region": "porto-seguro",
    "city_id": "porto-seguro",
    "location": "Orla Norte, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.4100461,
    "lng": -39.0480098,
    "subtitle": "Orla norte com barracas e hospedagens.",
    "history": "Integra o corredor turístico entre o centro e Taperapuã.",
    "tide_note": "As condições de banho variam; consulte o boletim atual.",
    "access_note": "A Avenida Beira-Mar dá acesso à orla. Verifique travessias de pedestres no percurso.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://guia.melhoresdestinos.com.br/praias-porto-seguro-bahia.html/"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/relation/13071705",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "muta",
    "title": "Praia do Mutá",
    "region": "porto-seguro",
    "city_id": "porto-seguro",
    "location": "Orla Norte, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.3568522,
    "lng": -39.0126524,
    "subtitle": "No extremo norte, perto de Coroa Vermelha.",
    "history": "Compartilha a faixa costeira com a vizinha Coroa Vermelha, já em Santa Cruz Cabrália.",
    "tide_note": "Recifes influenciam o mar; confira as condições no dia.",
    "access_note": "Use os acessos públicos da orla norte. A caminhada pode ser longa desde o centro.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://guia.melhoresdestinos.com.br/praias-porto-seguro-bahia.html/"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/relation/13071702",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "curuipe-norte",
    "title": "Praia de Curuípe (Orla Norte)",
    "region": "porto-seguro",
    "city_id": "porto-seguro",
    "location": "Orla Norte, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.4305388,
    "lng": -39.060631,
    "subtitle": "Uma das praias mais próximas do centro.",
    "history": "Não confunda esta praia da orla norte com a região de Curuípe da Praia do Espelho.",
    "tide_note": "A aparência do mar varia com a maré e o tempo.",
    "access_note": "Acesso pela Avenida Beira-Mar e entradas públicas à praia.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://guia.melhoresdestinos.com.br/praias-porto-seguro-bahia.html/"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/relation/13071703",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  },
  {
    "id": "taperapua",
    "title": "Praia de Taperapuã",
    "region": "porto-seguro",
    "city_id": "porto-seguro",
    "location": "Orla Norte, Porto Seguro, BA",
    "category": "Praias",
    "lat": -16.3883747,
    "lng": -39.0411846,
    "subtitle": "Barracas e movimento na orla norte.",
    "history": "As grandes cabanas e a rede de hotéis ajudaram a consolidar a praia como polo turístico.",
    "tide_note": "A aparência do mar varia com a maré e o tempo.",
    "access_note": "Acesso pela Avenida Beira-Mar e entradas públicas à praia.",
    "requires_crossing_from_caraiva": false,
    "sources": [
      {
        "title": "Fonte do guia",
        "url": "https://guia.melhoresdestinos.com.br/praias-porto-seguro-bahia.html/"
      }
    ],
    "coordinate_source": "https://www.openstreetmap.org/node/12142271507",
    "coordinate_note": "Ponto de referência da praia no OpenStreetMap; confirme o acesso público no mapa.",
    "reviewed_at": "2026-10-21"
  }
].map(item => ({...item, ...BEACH_GUIDES[item.id]})).concat(CARAIVA_BEACHES, TRANCOSO_PLACES, tripPlaces);
export const LODGINGS = [
  {
    "id": "eco-glamping-caraiva",
    "name": "Eco Glamping Caraiva",
    "title": "Eco Glamping Caraiva",
    "address": "Rua da Estação, S/N — Aldeia Pataxó-Xandó, Caraíva, Porto Seguro, BA",
    "subtitle": "Ponto da hospedagem: confira a entrada no mapa",
    "lat": -16.81066,
    "lng": -39.149017,
    "source": "researched",
    "source_url": "https://www.ehotelsreviews.com/eco-glamping-caraiva-5082334-en"
  }
];
