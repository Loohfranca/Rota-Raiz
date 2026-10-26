// Pesquisa em 26/10/2026. Sem coordenada verificada, localizar pelo nome; não inventar pinos ou km.
export const CARAIVA_BEACHES = [
  {
    id: "caraiva-barra",
    title: "Praia da Barra de Caraíva",
    region: "caraiva",
    city_id: "caraiva",
    location: "Caraíva, Porto Seguro, BA",
    category: "Praias",
    address: "Praia da Barra de Caraíva, Caraíva, Porto Seguro, BA",
    route_by_name: true,
    subtitle: "O encontro do rio com o mar, junto à vila.",
    description:
      "Trecho da foz, com lados voltados ao rio e ao oceano. É diferente da Prainha, que fica rio acima.",
    history:
      "Trecho da foz, com lados voltados ao rio e ao oceano. É diferente da Prainha, que fica rio acima.",
    tide_note:
      "A correnteza na foz pode ser forte. Não atravesse o rio a nado.",
    facilities: "Barracas e cadeiras na região da barra.",
    highlights: ["Na vila", "Rio e mar"],
    access_options: [
      {
        id: "walk",
        title: "A pé",
        from: "Vila de Caraíva",
        distance: "Calcule da sua hospedagem",
        duration: "Varia dentro da vila",
        price: "Sem transporte pago",
        steps: [
          "Siga pela beira-rio da vila até a barra.",
          "Escolha o trecho do rio ou do mar e observe a correnteza.",
        ],
        note: "",
      },
    ],
    guide_sources: [
      {
        title: "Viaje na Viagem · Barra e Prainha",
        url: "https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/",
      },
    ],
    sources: [
      {
        title: "Viaje na Viagem · Barra e Prainha",
        url: "https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/",
      },
    ],
    reviewed_at: "2026-10-26",
  },
  {
    id: "caraiva-pedra-negro",
    title: "Praia da Pedra do Negro / Xandó",
    region: "caraiva",
    city_id: "caraiva",
    location: "Aldeia Xandó, Caraíva, Porto Seguro, BA",
    category: "Praias",
    address:
      "Praia da Pedra do Negro / Xandó, Aldeia Xandó, Caraíva, Porto Seguro, BA",
    route_by_name: true,
    subtitle: "Coqueiros e piscinas na orla da Aldeia Xandó.",
    description:
      "Continuação da praia ao sul da vila, junto ao território Pataxó. Pedra do Negro e Xandó identificam trechos dessa mesma orla.",
    history:
      "Continuação da praia ao sul da vila, junto ao território Pataxó. Pedra do Negro e Xandó identificam trechos dessa mesma orla.",
    tide_note:
      "As piscinas entre pedras aparecem na maré baixa. Confira ondas e a volta.",
    facilities: "Confirme os serviços no trecho escolhido; leve água.",
    highlights: ["Aldeia Xandó", "Piscinas na baixa-mar"],
    access_options: [
      {
        id: "walk",
        title: "A pé",
        from: "Vila de Caraíva",
        distance: "Varia com o trecho de Xandó",
        duration: "Calcule desde sua origem",
        price: "Sem transporte pago",
        steps: [
          "Da orla de Caraíva, caminhe para o sul, no sentido de Xandó.",
          "Procure o trecho da Pedra do Negro; respeite a comunidade e as passagens locais.",
        ],
        note: "",
      },
    ],
    guide_sources: [
      {
        title: "Guia local · Pedra do Negro e piscinas",
        url: "https://www.caraivabahia.com.br/passeios.htm",
      },
    ],
    sources: [
      {
        title: "Guia local · Pedra do Negro e piscinas",
        url: "https://www.caraivabahia.com.br/passeios.htm",
      },
    ],
    reviewed_at: "2026-10-26",
    aliases: ["Praia de Xandó", "Pedra do Nego", "Pedra do Negro"],
  },
  {
    id: "juacema",
    title: "Praia de Juacema",
    region: "caraiva",
    city_id: "caraiva",
    location: "Litoral norte de Caraíva, Porto Seguro, BA",
    category: "Praias",
    address: "Praia de Juacema, Litoral norte de Caraíva, Porto Seguro, BA",
    route_by_name: true,
    subtitle: "Lagoas e falésias no caminho ao norte de Satú.",
    description:
      "Praia da costa entre Caraíva e Espelho, procurada por quem segue além do Satú. Não é uma caminhada curta pela vila.",
    history:
      "Praia da costa entre Caraíva e Espelho, procurada por quem segue além do Satú. Não é uma caminhada curta pela vila.",
    tide_note:
      "Planeje ida e volta na maré favorável; a cheia pode fechar passagens na costa.",
    facilities:
      "Não conte com apoio contínuo. Leve água e combine acompanhamento local.",
    highlights: ["Além do Satú", "Caminhada costeira"],
    access_options: [
      {
        id: "walk",
        title: "Canoa + caminhada",
        from: "Vila de Caraíva",
        distance: "Trecho além do Satú; distância não aferida",
        duration: "Caminhada longa; consulte guia",
        price: "Canoa e guia sob consulta",
        steps: [
          "Atravesse o Rio Caraíva de canoa.",
          "Siga para o norte, passando pelo Satú, com orientação local para Juacema.",
          "Acerte o retorno antes de sair.",
        ],
        note: "O cálculo automático pode seguir outro caminho e não substitui a orientação costeira.",
      },
    ],
    guide_sources: [
      {
        title: "Guia de Caraíva · Juacema",
        url: "https://visitbrazil.travel/2021/08/23/caraiva/",
      },
    ],
    sources: [
      {
        title: "Guia de Caraíva · Juacema",
        url: "https://visitbrazil.travel/2021/08/23/caraiva/",
      },
    ],
    reviewed_at: "2026-10-26",
    coastal_reference: true,
    requires_crossing_from_caraiva: true,
  },
  {
    id: "barra-velha-praia",
    title: "Praia de Barra Velha",
    region: "caraiva",
    city_id: "caraiva",
    location: "Barra Velha, Caraíva, Porto Seguro, BA",
    category: "Praias",
    address: "Praia de Barra Velha, Barra Velha, Caraíva, Porto Seguro, BA",
    route_by_name: true,
    subtitle: "Praia e território Pataxó ao sul de Caraíva.",
    description:
      "A praia acompanha a região da Aldeia Mãe Barra Velha, ligada ao Parque Nacional e Histórico do Monte Pascoal.",
    history:
      "A praia acompanha a região da Aldeia Mãe Barra Velha, ligada ao Parque Nacional e Histórico do Monte Pascoal.",
    tide_note:
      "Prefira maré baixa para caminhar e combine a volta com anfitriões locais.",
    facilities: "Combine visitas à aldeia e eventual apoio com moradores.",
    highlights: ["Território Pataxó", "Ao sul de Caraíva"],
    access_options: [
      {
        id: "walk",
        title: "A pé",
        from: "Vila de Caraíva",
        distance: "Referência de cerca de 6 km pela costa",
        duration: "Depende da saída e da maré",
        price: "Guia ou apoio: combinar",
        steps: [
          "Siga pela praia para o sul, no sentido de Barra Velha.",
          "Combine o acesso à aldeia com anfitriões; a praia não tem um único ponto de chegada.",
        ],
        note: "",
      },
      {
        id: "road",
        title: "Buggy local",
        from: "Vila de Caraíva",
        distance: "Depende do ponto de saída",
        duration: "Confirme o tempo e o retorno",
        price: "Combine antes de sair",
        steps: [
          "Consulte os bugueiros Pataxó em Xandó.",
          "Combine o acesso permitido, a parada e o retorno.",
        ],
        note: "Circulação pela areia tem restrições de trecho e maré.",
      },
    ],
    guide_sources: [
      {
        title: "Guia de Caraíva · Barra Velha",
        url: "https://visitbrazil.travel/2021/08/23/caraiva/",
      },
      {
        title: "ICMBio · visitação e buggy",
        url: "https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/mata-atlantica/lista-de-ucs/parna-e-historico-do-monte-pascoal/informacoes-sobre-visitacao-parna-e-historico-do-monte-pascoal/passeios",
      },
    ],
    sources: [
      {
        title: "Guia de Caraíva · Barra Velha",
        url: "https://visitbrazil.travel/2021/08/23/caraiva/",
      },
      {
        title: "ICMBio · visitação e buggy",
        url: "https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/mata-atlantica/lista-de-ucs/parna-e-historico-do-monte-pascoal/informacoes-sobre-visitacao-parna-e-historico-do-monte-pascoal/passeios",
      },
    ],
    reviewed_at: "2026-10-26",
  },
  {
    id: "caraiva-prainha",
    title: "Prainha do Rio Caraíva",
    region: "caraiva",
    city_id: "caraiva",
    location: "Rio Caraíva, Aldeia Xandó, Porto Seguro, BA",
    category: "Praia de rio",
    address:
      "Prainha do Rio Caraíva, Rio Caraíva, Aldeia Xandó, Porto Seguro, BA",
    route_by_name: true,
    subtitle: "Praia de rio para uma pausa e o pôr do sol.",
    description:
      "Fica rio acima, longe da foz. É um passeio de água doce, diferente das praias de mar da região.",
    history:
      "Fica rio acima, longe da foz. É um passeio de água doce, diferente das praias de mar da região.",
    tide_note:
      "O rio tem correnteza e influência da maré. Confirme as condições com quem opera no local.",
    facilities:
      "Há apoio local; confirme funcionamento e leve lanterna se voltar depois do pôr do sol.",
    highlights: ["Praia de rio", "Pôr do sol"],
    access_options: [
      {
        id: "walk",
        title: "A pé",
        from: "Vila de Caraíva",
        distance: "Calcule desde sua origem",
        duration: "Guias citam 25–40 min desde a vila",
        price: "Confirme as regras do acesso",
        steps: [
          "Peça à hospedagem o acesso atual à trilha da Prainha.",
          "Siga pelo caminho indicado; leve luz para o retorno ao entardecer.",
        ],
        note: "",
      },
      {
        id: "boat",
        title: "Barco pelo rio",
        from: "Vila de Caraíva",
        distance: "Depende do ponto de saída",
        duration: "Confirme o tempo e o retorno",
        price: "Sob cotação",
        steps: [
          "Combine embarque na beira-rio.",
          "Acerte permanência na Prainha e transporte de volta.",
        ],
        note: "",
      },
    ],
    guide_sources: [
      {
        title: "Pousada Nativa · Prainha",
        url: "https://www.pousadanativacaraiva.com.br/br/experi-ncias",
      },
      {
        title: "Viaje na Viagem · Prainha",
        url: "https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/",
      },
    ],
    sources: [
      {
        title: "Pousada Nativa · Prainha",
        url: "https://www.pousadanativacaraiva.com.br/br/experi-ncias",
      },
      {
        title: "Viaje na Viagem · Prainha",
        url: "https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/",
      },
    ],
    reviewed_at: "2026-10-26",
    lat: -16.8202163,
    lng: -39.1558124,
    coordinate_source: "https://www.openstreetmap.org/node/9494946686",
    coordinate_note:
      "Referência da Prainha Xandó no OpenStreetMap; confirme a trilha de acesso.",
  },
  {
    id: "corumbau",
    title: "Ponta do Corumbau",
    region: "caraiva",
    city_id: "corumbau",
    location: "Ponta do Corumbau, Prado, BA",
    category: "Praias",
    address: "Ponta do Corumbau, Ponta do Corumbau, Prado, BA",
    route_by_name: true,
    subtitle: "Passeio ao sul, com buggy e travessia de canoa.",
    description:
      "Destino em Prado, visitado a partir de Caraíva. A ponta de areia muda com a maré e não é uma praia dentro da vila de Caraíva.",
    history:
      "Destino em Prado, visitado a partir de Caraíva. A ponta de areia muda com a maré e não é uma praia dentro da vila de Caraíva.",
    tide_note:
      "A ponta aparece melhor na maré baixa. Combine travessia e retorno; o acesso muda com a maré.",
    facilities:
      "Restaurantes na região de chegada. Confirme serviços e leve dinheiro para a travessia.",
    highlights: ["Passeio nos arredores", "Buggy + canoa"],
    access_options: [
      {
        id: "road",
        title: "Buggy + canoa",
        from: "Vila de Caraíva",
        distance: "Estrada e trechos autorizados",
        duration: "Reserve tempo para o passeio",
        price: "Buggy e canoa: confirme o que está incluído",
        steps: [
          "Combine a saída com bugueiros Pataxó em Xandó.",
          "Siga até o Rio Corumbau e atravesse de canoa.",
          "Caminhe até a praia; confirme a volta com o mesmo operador.",
        ],
        note: "O ICMBio restringe a circulação pela praia a trechos autorizados na maré baixa.",
      },
      {
        id: "boat",
        title: "Lancha",
        from: "Vila de Caraíva",
        distance: "Depende do ponto de saída",
        duration: "Confirme o tempo e o retorno",
        price: "Sob cotação",
        steps: [
          "Reserve com operadores de Caraíva.",
          "Acerte desembarque e volta conforme mar e maré.",
        ],
        note: "",
      },
      {
        id: "walk",
        title: "Caminhada + canoa",
        from: "Vila de Caraíva",
        distance: "Referência de cerca de 10 km desde a vila",
        duration: "3–4 h de caminhada · só ida",
        price: "Canoa e retorno pagos à parte",
        steps: [
          "Caminhe para o sul pela costa com acompanhamento local.",
          "Na chegada ao Rio Corumbau, faça a travessia de canoa.",
          "Combine transporte para retornar a Caraíva.",
        ],
        note: "Percurso longo e exposto ao sol; não atravesse o rio a nado.",
      },
    ],
    guide_sources: [
      {
        title: "ICMBio · travessia e buggy",
        url: "https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/mata-atlantica/lista-de-ucs/parna-e-historico-do-monte-pascoal/informacoes-sobre-visitacao-parna-e-historico-do-monte-pascoal/passeios",
      },
      {
        title: "Pousada Nativa · Corumbau",
        url: "https://www.pousadanativacaraiva.com.br/br/experi-ncias",
      },
      {
        title: "Viaje na Viagem · caminhada",
        url: "https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/",
      },
    ],
    sources: [
      {
        title: "ICMBio · travessia e buggy",
        url: "https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/mata-atlantica/lista-de-ucs/parna-e-historico-do-monte-pascoal/informacoes-sobre-visitacao-parna-e-historico-do-monte-pascoal/passeios",
      },
      {
        title: "Pousada Nativa · Corumbau",
        url: "https://www.pousadanativacaraiva.com.br/br/experi-ncias",
      },
      {
        title: "Viaje na Viagem · caminhada",
        url: "https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/",
      },
    ],
    reviewed_at: "2026-10-26",
    coastal_reference: true,
    lat: -16.8968108,
    lng: -39.1147972,
    coordinate_source: "https://www.openstreetmap.org/node/1696338577",
    coordinate_note:
      "Referência da vila de Corumbau; o acesso final à praia depende da travessia e do desembarque.",
  },
];
