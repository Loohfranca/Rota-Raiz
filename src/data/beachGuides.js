// Guias de acesso: referências publicadas, nunca distâncias da hospedagem do usuário.
const option = (id, title, from, distance, duration, price, steps, note = '') => ({ id, title, from, distance, duration, price, steps, note });
const source = (title,url) => ({title,url});
const walk = (from, steps, distance='Calcule da sua origem', duration='Varia com o ponto de saída',note='') => option('walk','A pé',from,distance,duration,'Sem transporte pago',steps,note);
const road = (from,steps,note='Confirme tarifa e retorno antes de sair.') => option('road','Táxi / carro',from,'Pelo acesso terrestre','A combinar','Sob consulta',steps,note);
const transit = (from,steps,note='Confirme o destino e o último retorno com o motorista.') => option('transit','Van / ônibus',from,'Pelo trajeto da linha','Conforme operação','Tarifa a confirmar',steps,note);
export const BEACH_GUIDES = {
  satu: {
    subtitle: 'Canoa, caminhada na areia e um dia entre lagoas e recifes.',
    description: 'Ao norte de Caraíva, o Satú reúne piscinas naturais na baixa-mar, lagoas e barracas. O passeio começa pelo planejamento do acesso: a caminhada costeira exige uma travessia de canoa.',
    highlights: ['Lagoas de água doce','Piscinas na maré baixa','Barracas e beach clubs'],
    essentials: [{label:'Caminhada costeira',value:'3–4 km após a canoa'},{label:'Tempo na areia',value:'50–60 min · só ida'},{label:'Melhor condição',value:'Maré baixando / baixa'}],
    access_options: [
      option('walk','Canoa + a pé','Vila de Caraíva → Satú','3–4 km após a travessia','50–60 min de caminhada','Canoa: referência de R$ 10 / trecho',[
        'Vá ao ponto dos canoeiros próximo à Praia da Barra e atravesse o Rio Caraíva de canoa.',
        'Na margem norte, siga pela faixa de areia em direção ao Satú. A referência de distância começa depois da travessia.',
        'Combine a volta com a maré ainda favorável; leve água e calçado para a areia quente.'
      ],'Não é uma rota inteiramente a pé. Confirme a tarifa da canoa no dia e não tente atravessar o rio a nado.'),
      option('boat','Lancha','Beira do rio, em Caraíva','Trajeto pelo mar','Conforme mar e embarcação','Cotação de ida e volta',[
        'Combine com um barqueiro o embarque em Caraíva e o desembarque no Satú.',
        'Acerte horário de retorno, permanência e se o preço inclui ida e volta.'
      ],'O desembarque depende das ondas; confirme a operação e o horário da maré.'),
      road('Nova Caraíva → Satú',[
        'Reserve antes com uma barraca ou hospedagem para autorizar a passagem pela propriedade particular.',
        'Se sair da vila, combine a canoa até a margem onde encontrará o motorista.',
        'O acesso termina no alto da falésia; uma escadaria leva à praia.'
      ],'Sem reserva, a entrada de carro pode ser recusada. Escadaria íngreme; confirme acessibilidade e regras do estabelecimento.')
    ],
    tide_note: 'Programe a ida e a volta para a maré baixando ou baixa. Na cheia, alguns trechos perdem a passagem pela areia.',
    facilities: 'Satu Beach Club, Mangaba Satú e outras barracas. Consumo mínimo e regras variam; pergunte antes de reservar. Leve água e dinheiro para a canoa.',
    coastal_reference: true,
    guide_sources: [source('Bahia Terra · acessos e reserva','https://www.bahiaterra.com/posts/praia-do-satu'),source('Esse Mundo É Nosso · caminhada e estrutura','https://www.essemundoenosso.com.br/praia-satu-caraiva-bahia/'),source('Porto Seguro Passeios · referência de canoa','https://portoseguropasseios.com.br/passeio/praia-do-satu-caraiva')],
    photo: {url:'https://commons.wikimedia.org/wiki/Special:FilePath/Praia_do_Satu.jpg?width=1280',author:'Thomasilhabela',source:'https://commons.wikimedia.org/wiki/File:Praia_do_Satu.jpg',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
  },
  espelho: {
    description: 'Falésias, recifes e piscinas naturais fazem do Espelho um passeio que vale organizar para a baixa-mar. Saindo de Caraíva, há acesso costeiro com canoa, lancha ou transporte por estrada.',
    highlights: ['Piscinas naturais','Falésias e mirantes','Restaurantes à beira-mar'],
    essentials: [{label:'Pela costa',value:'Cerca de 9 km'},{label:'Caminhada',value:'3–4 h · só ida'},{label:'Acesso',value:'Canoa + praia e trilhas'}],
    access_options: [option('walk','Canoa + trilha','Margem norte do Rio Caraíva → Espelho','Cerca de 9 km após a travessia','3–4 h · só ida','Canoa paga à parte',[
      'Atravesse o Rio Caraíva de canoa a partir da vila.',
      'Siga para o norte, passando pelo Satú. Há areia, trechos de pedras e trilhas junto às falésias.',
      'Planeje a janela de maré e a volta antes da saída. Para conhecer o caminho, combine acompanhamento local.'
    ],'É uma caminhada longa. Não siga com a maré fechando a passagem; considere voltar de lancha ou transporte combinado.'),option('boat','Lancha','Beira do rio em Caraíva','Passeio marítimo','A combinar','Sob consulta',['Reserve com barqueiros de Caraíva.','Acerte tempo na praia, retorno e eventual parada no Satú.'],'A saída e o desembarque dependem das condições do mar.'),road('Caraíva / Trancoso → Curuípe',['Combine transporte até o acesso da Praia do Espelho.','Confirme o ponto de encontro se sair da vila de Caraíva, pois há travessia de canoa.','Do estacionamento/acesso, siga a pé até a praia.'])],
    tide_note:'As piscinas aparecem melhor na baixa-mar. Na rota costeira, a cheia pode bloquear trechos próximos às falésias.',
    facilities:'Há restaurantes e pousadas. Pergunte por consumo mínimo e estacionamento antes de escolher o estabelecimento.',coastal_reference:true,
    guide_sources:[source('Viaje na Viagem · trilha desde Caraíva','https://www.viajenaviagem.com/destino/caraiva/o-que-fazer/'),source('Melhores Destinos · acesso e estrutura','https://www.melhoresdestinos.com.br/praia-do-espelho-dicas.html')],
    photo:{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Praia_do_Espelho_(28556208286).jpg?width=1280',author:'Rafael Vianna Croffi',source:'https://commons.wikimedia.org/wiki/File:Praia_do_Espelho_(28556208286).jpg',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/'},
  },
  'caraiva-praia': {
    description:'A praia aberta ao mar acompanha as ruas de areia da vila e segue para Xandó. Na Barra, ao norte, o rio encontra o oceano; ao sul ficam trechos de praia e piscinas junto à comunidade Pataxó.',
    highlights:['Ruas de areia','Orla da vila','Xandó e Pedra do Negro'],
    access_options:[walk('Vila de Caraíva',['Siga pelas ruas de areia até um acesso à orla.','Escolha o trecho da praia onde quer chegar; a distância varia ao longo da costa.'],'Calcule da sua hospedagem','Conforme o acesso escolhido')],
    facilities:'Há bares na vila e opções na orla. Para caminhar para além dos trechos movimentados, leve água e combine o retorno.',
    guide_sources:[source('Guia local de Caraíva · caminhadas','https://www.caraivabahia.com.br/passeios.htm')],
  },
  mucuge: {
    description:'É a praia mais prática para combinar o centro de Arraial com um dia de mar. O acesso desce pela Rua do Mucugê; na volta, o mesmo caminho exige subir a ladeira.',highlights:['Perto do centro','Barracas e restaurantes','Acesso pela Rua do Mucugê'],
    access_options:[walk('Centro de Arraial',['Desça a Rua do Mucugê em direção ao mar.','Continue até o acesso à faixa de areia. Na volta, considere a subida da ladeira.'],'Cerca de 1,5 km desde o Centro Histórico'),road('Arraial d’Ajuda',['Siga até o acesso do Mucugê e confirme um estacionamento.','Faça o trecho final a pé.'])],
    facilities:'Orla com barracas, restaurantes e hospedagens. Confira o consumo e o uso de mesas antes de se instalar.',guide_sources:[source('Melhores Destinos · Mucugê','https://guia.melhoresdestinos.com.br/mucuge-54-251-l.html')],
  },
  parracho: {
    description:'Conhecido pelos luaus que marcaram o turismo de Arraial desde os anos 1980, o Parracho mantém o perfil de praia com barracas e animação.',highlights:['Barracas e eventos','Vizinha ao Mucugê','Piscinas na baixa-mar'],
    access_options:[walk('Praia do Mucugê',['Chegue ao Mucugê e, olhando para o mar, siga pela areia para a direita, rumo ao sul.','Continue até o trecho do Parracho.'],'Cerca de 250 m desde o Mucugê','Trecho curto pela praia','Confira a maré antes de caminhar pela areia.'),transit('Centro de Arraial',['Procure as vans para a região da Pitinga.','Peça ao motorista o desembarque no acesso ao Parracho.']),road('Estrada da Pitinga',['Siga pela Estrada da Pitinga até o estabelecimento ou acesso escolhido.','Confirme estacionamento; não pare na estrada estreita.'])],
    facilities:'Barracas com diferentes perfis, de descanso a festas. Confirme a programação para escolher um trecho mais tranquilo.',guide_sources:[source('Visite Arraial · Parracho','https://visitearraialdajuda.com/praia-do-parracho')],
  },
  pitinga: {
    description:'As falésias e o riozinho são os destaques da Pitinga. Dá para combinar o passeio com Mucugê e Parracho, caminhando pela costa na maré favorável.',highlights:['Falésias','Riozinho da Pitinga','Barracas de praia'],
    access_options:[walk('Praia do Mucugê',['Desça ao Mucugê e siga para a direita, rumo ao sul.','Passe pelo Parracho e continue até as barracas e falésias da Pitinga.'],'Cerca de 2 km desde o Mucugê','Conforme a maré e o ritmo','Desde o centro de Arraial, o trajeto completo passa de 3 km.'),transit('Praça São Brás · Arraial',['Procure as vans para Pitinga na Praça São Brás.','Confirme o ponto de desembarque e, na ida, o último retorno.']),road('Centro de Arraial',['Siga pela Estrada da Pitinga até o acesso da praia.','Confirme estacionamento e caminhe o trecho final.'])],
    facilities:'Barracas para refeições e apoio. Fique afastado da base das falésias e verifique as condições dos acessos.',guide_sources:[source('Visite Arraial · Pitinga','https://visitearraialdajuda.com/praia-da-pitinga')],
  },
  'apaga-fogo':{
    description:'É a primeira praia de Arraial para quem chega pela balsa. A ponta permite observar o encontro do Buranhém com o mar e a cidade de Porto Seguro do outro lado.',highlights:['Perto da balsa','Encontro do rio com o mar','Recifes na baixa-mar'],
    access_options:[walk('Desembarque da balsa em Arraial',['Atravesse a rua com cuidado e procure o acesso à praia em frente à região de desembarque.','Siga até o trecho da orla que deseja visitar.'],'Acesso próximo à balsa','Caminhada curta'),transit('Centro de Arraial',['Pegue uma van ou ônibus no sentido das balsas.','Desça na região da balsa e complete a pé.'])],
    facilities:'Há hospedagens e estruturas de praia. Desde Porto Seguro, é necessário atravessar o Buranhém antes do trecho a pé.',guide_sources:[source('Visite Arraial · Apaga Fogo','https://visitearraialdajuda.com/praia-do-apaga-fogo')],
  },
  aracaipe:{
    description:'Entre Apaga Fogo e Pescadores, Araçaípe combina piscinas na maré baixa e barracas, em um trecho geralmente menos movimentado que o Mucugê.',highlights:['Piscinas na baixa-mar','Estrada da Balsa','Estrutura de praia'],
    access_options:[walk('Estrada da Balsa',['Siga até a sinalização e um acesso público à Praia de Araçaípe.','Partindo da balsa, a referência é cerca de 1,5 km pela estrada.'],'Cerca de 1,5 km da balsa'),transit('Balsa ↔ centro de Arraial',['Use van ou ônibus pela Estrada da Balsa.','Avise o destino e peça indicação do acesso à praia.'])],
    facilities:'Barracas e pousadas com estruturas abertas ao público. Confirme regras e consumo no local.',guide_sources:[source('Visite Arraial · Araçaípe','https://visitearraialdajuda.com/praia-de-aracaipe')],
  },
  pescadores:{
    description:'Também chamada Praia do Delegado, guarda a presença dos barcos de pesca e um ambiente procurado por moradores. Os recifes ficam mais visíveis na baixa-mar.',highlights:['Barcos de pesca','Perto do centro','Também chamada Delegado'],
    access_options:[walk('Praça da Igreja · Arraial',['Desça pela região da Ladeira da Santa em direção ao acesso da praia.','Siga pelo caminho local até a orla.']),transit('Estrada da Balsa',['Pegue van ou ônibus que passe pela Estrada da Balsa.','Peça para descer no acesso à Praia dos Pescadores.'])],
    facilities:'Estrutura mais simples. A Barraca do Nel é uma referência local; confirme funcionamento e leve água.',guide_sources:[source('Visite Arraial · Pescadores','https://visitearraialdajuda.com/praia-dos-pescadores')],
  },
  taipe:{
    description:'Mais afastado do centro, Taípe combina falésias, rio e mar aberto. Sem uma barreira contínua de recifes, pode ter ondas mesmo com a maré baixa.',highlights:['Rio do Taípe','Falésias','Mar aberto'],
    access_options:[walk('Mucugê ou Pitinga',['Pela costa, siga para o sul a partir da Pitinga, passando pela região da Lagoa Azul.','Confira a passagem e a maré de ida e volta antes da caminhada.'],'Cerca de 5 km do Mucugê / 3,5 km da Pitinga','Caminhada longa pela areia'),road('Centro de Arraial',['Combine carro ou táxi pelo acesso terrestre ao Taípe.','Confirme o acesso e o retorno; o caminho por estrada é mais longo que pela praia.'],'Referência publicada: cerca de 14 km por estrada desde o centro.')],
    facilities:'Planeje água, proteção solar e retorno. Evite se aproximar da base das falésias.',guide_sources:[source('Visite Arraial · Taípe','https://visitearraialdajuda.com/praia-do-taipe')],
  },
};
Object.assign(BEACH_GUIDES, {
  mundai:{description:'Entre Curuípe e Taperapuã, Mundaí tem orla urbanizada e cabanas com perfis familiares ou mais animados. É possível caminhar desde o centro sem depender de trilha pela praia.',highlights:['Orla urbanizada','Cabanas e restaurantes','Entre Curuípe e Taperapuã'],access_options:[walk('Centro de Porto Seguro',['Siga para o norte pela orla urbanizada da Avenida Beira-Mar.','Escolha o acesso a Mundaí e atravesse a via com cuidado.'],'Referência: cerca de 3,6 km do centro'),transit('Centro de Porto Seguro',['Procure ônibus com indicação de praias / orla norte.','Confirme com o motorista o ponto para Mundaí.'])],facilities:'Há cabanas e restaurantes. No limite com Taperapuã, o movimento costuma ser maior.',guide_sources:[source('Melhores Destinos · Mundaí','https://guia.melhoresdestinos.com.br/mundai-porto-seguro-52-231-l.html/')]},
  'curuipe-norte':{description:'Na orla norte, Curuípe é uma opção próxima ao centro e acessível pela avenida. Esta é a praia urbana de Porto Seguro, não a região de Curuípe da Praia do Espelho.',highlights:['Perto do centro','Orla para caminhada','Barracas pontuais'],access_options:[walk('Centro de Porto Seguro',['Siga para o norte pela Avenida Beira-Mar.','Use um acesso público à Praia de Curuípe.'],'Calcule do seu ponto de saída'),transit('Centro de Porto Seguro',['Pegue transporte para a orla norte.','Confirme o ponto de Curuípe com o motorista.'])],facilities:'Há menos cabanas que em Taperapuã. A orla também permite passeio de bicicleta.',guide_sources:[source('Melhores Destinos · Curuípe','https://guia.melhoresdestinos.com.br/praia-de-curuipe-em-porto-seguro.html')]},
  taperapua:{description:'Taperapuã é conhecida pelas grandes cabanas que deram fama às festas de Porto Seguro. Os trechos da orla têm perfis diferentes: escolha a barraca e o acesso antes de calcular a caminhada.',highlights:['Megabarracas','Orla extensa','Hotéis e restaurantes'],access_options:[walk('Sua hospedagem na orla norte',['Calcule o caminho até o trecho desejado de Taperapuã.','Use os passeios e acessos públicos da Avenida Beira-Mar.'],'Varia ao longo da praia','Calcule da sua origem','Desde o centro, a caminhada é longa. O ponto do mapa é uma referência, não a entrada de todas as barracas.'),transit('Centro de Porto Seguro',['Procure ônibus para as praias da orla norte.','Diga o nome da barraca ou do acesso para confirmar o desembarque.']),road('Avenida Beira-Mar',['Combine táxi, aplicativo ou transfer até a barraca escolhida.','Confirme estacionamento se for de carro.'])],facilities:'Grande oferta de barracas. Pergunte por consumo mínimo, uso de mesas e programação musical.',guide_sources:[source('Melhores Destinos · Taperapuã','https://guia.melhoresdestinos.com.br/taperapua-porto-seguro-52-232-l.html')]},
  muta:{description:'No extremo norte de Porto Seguro, Mutá divide a faixa de areia com Coroa Vermelha, já em Santa Cruz Cabrália. É um passeio de orla com barracas e recifes, normalmente feito de transporte desde o centro.',highlights:['Recifes','Próxima a Coroa Vermelha','Barracas de praia'],access_options:[walk('Hospedagens próximas a Mutá',['Escolha um acesso público próximo à sua hospedagem.','Calcule o caminho até o trecho da praia que deseja visitar.'],'Calcule da sua origem','Conforme o ponto de partida','Mutá fica longe do centro de Porto Seguro; compare com ônibus ou táxi.'),transit('Centro de Porto Seguro',['Procure a linha no sentido de Santa Cruz Cabrália.','Confirme com o motorista se passa pelo acesso ao Mutá escolhido e combine a referência de descida.']),road('Orla norte de Porto Seguro',['Siga pela BR-367 / Avenida Beira-Mar no sentido de Coroa Vermelha.','Escolha um acesso e estacionamento, sem bloquear entradas.'])],facilities:'Barracas e restaurantes na orla. Os recifes e a maré mudam as condições de banho.',guide_sources:[source('Viaje na Viagem · transporte na orla','https://www.viajenaviagem.com/destino/porto-seguro/o-que-fazer/'),source('Melhores Destinos · praias de Porto Seguro','https://guia.melhoresdestinos.com.br/praias-porto-seguro-bahia.html/')]},
});
const commonsPhoto = (name,author,license,version) => ({url:`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1280`,author,source:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`,license,licenseUrl:`https://creativecommons.org/licenses/${version}/`});
BEACH_GUIDES.pitinga.photo = commonsPhoto('Praia da Pitinga Bahia.jpg','Beto Quissak','CC BY-SA 4.0','by-sa/4.0');
BEACH_GUIDES.mucuge.photo = commonsPhoto('Praia deserta em mucugê.jpg','Thomasilhabela','CC BY-SA 4.0','by-sa/4.0');
BEACH_GUIDES.taperapua.photo = commonsPhoto('Vista da Praia de Taperapuã, Porto Seguro BA.JPG','HVL','CC BY 3.0','by/3.0');
