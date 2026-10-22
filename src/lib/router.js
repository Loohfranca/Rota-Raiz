// Motor de Roteamento em Grafo e Algoritmo de Dijkstra para o Rota Raiz
// Litoral Sul da Bahia: Balsas, Vans, Ônibus, Barcos, Canoas e Trilhas

// Normalização de texto sem acentos para busca flexível
export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Cálculo de Distância Haversine (em km)
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Encontra a parada mais próxima das coordenadas GPS
export const findClosestStop = (lat, lng, stops = []) => {
  if (!stops || stops.length === 0 || lat == null || lng == null) return null;
  let closest = null;
  let minDistance = Infinity;

  stops.forEach((stop) => {
    const dist = haversineDistance(lat, lng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = { ...stop, distanceKm: dist };
    }
  });

  return closest;
};

// Autocomplete Unificado: Cidades, Paradas de Transporte e Pontos Turísticos
export const searchLocations = (query, stops = [], places = [], cities = []) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    // Retorna os principais destinos padrão
    return [
      { id: 'stop-balsa-ps', name: 'Porto Seguro (Balsa)', type: 'stop', stopId: 'stop-balsa-ps' },
      { id: 'stop-balsa-arraial', name: "Arraial d'Ajuda (Balsa)", type: 'stop', stopId: 'stop-balsa-arraial' },
      { id: 'stop-trevo-trancoso', name: 'Trancoso (Quadrado / Trevo)', type: 'stop', stopId: 'stop-trevo-trancoso' },
      { id: 'stop-curuipe-espelho', name: 'Praia do Espelho (Curuípe)', type: 'place', stopId: 'stop-curuipe-espelho' },
      { id: 'stop-vila-caraiva', name: 'Caraíva (Vila de Areia)', type: 'place', stopId: 'stop-vila-caraiva' },
      { id: 'stop-ponta-corumbau', name: 'Ponta do Corumbau', type: 'place', stopId: 'stop-ponta-corumbau' },
    ];
  }

  const results = [];
  const seenIds = new Set();

  // 1. Cidades
  cities.forEach((city) => {
    if (normalizeText(city.name).includes(normalizedQuery)) {
      // Pega a parada principal da cidade
      const mainStop = stops.find((s) => s.city_id === city.id) || stops[0];
      const item = {
        id: `city-${city.id}`,
        name: city.name,
        subtitle: 'Cidade / Região',
        type: 'city',
        stopId: mainStop?.id,
        lat: city.lat,
        lng: city.lng,
      };
      results.push(item);
      seenIds.add(item.id);
    }
  });

  // 2. Atrativos e Passeios
  places.forEach((place) => {
    const titleNorm = normalizeText(place.title);
    const locNorm = normalizeText(place.location);
    if (titleNorm.includes(normalizedQuery) || locNorm.includes(normalizedQuery)) {
      const item = {
        id: `place-${place.id}`,
        name: place.title,
        subtitle: place.location,
        type: 'place',
        stopId: place.closest_stop_id,
        lat: place.lat,
        lng: place.lng,
        placeRef: place,
      };
      results.push(item);
      seenIds.add(item.id);
    }
  });

  // 3. Paradas de Transporte
  stops.forEach((stop) => {
    const nameNorm = normalizeText(stop.name);
    const shortNorm = normalizeText(stop.short_name);
    if (nameNorm.includes(normalizedQuery) || shortNorm.includes(normalizedQuery)) {
      if (!seenIds.has(`stop-${stop.id}`)) {
        results.push({
          id: `stop-${stop.id}`,
          name: stop.name,
          subtitle: stop.short_name,
          type: 'stop',
          stopId: stop.id,
          lat: stop.lat,
          lng: stop.lng,
        });
      }
    }
  });

  return results.slice(0, 8);
};

// Resolução de um texto livre de busca para o nó de parada correspondente
export const resolveToStop = (textOrId, stops = [], places = [], cities = []) => {
  if (!textOrId) return null;
  
  // Se for ID direto de stop
  const directStop = stops.find((s) => s.id === textOrId);
  if (directStop) return directStop;

  // Se for ID de place
  const directPlace = places.find((p) => p.id === textOrId || `place-${p.id}` === textOrId);
  if (directPlace) {
    const associatedStop = stops.find((s) => s.id === directPlace.closest_stop_id);
    if (associatedStop) return associatedStop;
  }

  const queryNorm = normalizeText(textOrId);

  // Busca exata ou por inclusão nos nomes de cidades conhecidas
  if (queryNorm.includes('porto') || queryNorm.includes('seguro')) {
    return stops.find((s) => s.id === 'stop-balsa-ps') || stops[0];
  }
  if (queryNorm.includes('arraial') || queryNorm.includes('ajuda')) {
    return stops.find((s) => s.id === 'stop-balsa-arraial') || stops.find((s) => s.city_id === 'arraial-dajuda');
  }
  if (queryNorm.includes('trancoso') || queryNorm.includes('quadrado')) {
    return stops.find((s) => s.id === 'stop-trevo-trancoso') || stops.find((s) => s.id === 'stop-quadrado-trancoso');
  }
  if (queryNorm.includes('espelho') || queryNorm.includes('curuipe')) {
    return stops.find((s) => s.id === 'stop-curuipe-espelho');
  }
  if (queryNorm.includes('caraiva')) {
    return stops.find((s) => s.id === 'stop-vila-caraiva') || stops.find((s) => s.id === 'stop-nova-caraiva');
  }
  if (queryNorm.includes('corumbau')) {
    return stops.find((s) => s.id === 'stop-ponta-corumbau');
  }
  if (queryNorm.includes('taipe')) {
    return stops.find((s) => s.id === 'stop-taipe-entrada');
  }
  if (queryNorm.includes('jaqueira')) {
    return stops.find((s) => s.id === 'stop-aldeia-jaqueira');
  }

  // Fallback: busca por substring nos stops
  const matchingStop = stops.find((s) => {
    return normalizeText(s.name).includes(queryNorm) || normalizeText(s.short_name).includes(queryNorm);
  });

  return matchingStop || stops[0];
};

// Algoritmo de Dijkstra para calcular o caminho ótimo no grafo
const dijkstra = (startStopId, endStopId, stops, legs, weightKey = 'duration_min') => {
  const distances = {};
  const previous = {};
  const previousLeg = {};
  const unvisited = new Set();

  stops.forEach((stop) => {
    distances[stop.id] = Infinity;
    previous[stop.id] = null;
    previousLeg[stop.id] = null;
    unvisited.add(stop.id);
  });

  distances[startStopId] = 0;

  // Construir mapa de adjacência
  const adjacency = {};
  stops.forEach((stop) => {
    adjacency[stop.id] = [];
  });

  legs.forEach((leg) => {
    if (adjacency[leg.from_stop_id]) {
      adjacency[leg.from_stop_id].push(leg);
    }
  });

  while (unvisited.size > 0) {
    // Escolhe o nó não visitado com menor distância acumulada
    let currentId = null;
    let minDistance = Infinity;

    unvisited.forEach((id) => {
      if (distances[id] < minDistance) {
        minDistance = distances[id];
        currentId = id;
      }
    });

    if (currentId === null || minDistance === Infinity) {
      break; // Nós restantes são inalcançáveis
    }

    if (currentId === endStopId) {
      break; // Chegamos ao destino
    }

    unvisited.delete(currentId);

    const outgoingLegs = adjacency[currentId] || [];
    for (const leg of outgoingLegs) {
      const neighborId = leg.to_stop_id;
      if (unvisited.has(neighborId)) {
        let weight = leg[weightKey];
        if (weightKey === 'min_price') {
          // Pequeno fator para desempatar rotas grátis ou com o mesmo preço usando tempo
          weight = (leg.min_price || 0) + (leg.duration_min || 1) * 0.001;
        }

        const alt = distances[currentId] + weight;
        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = currentId;
          previousLeg[neighborId] = leg;
        }
      }
    }
  }

  // Reconstruir caminho
  const pathLegs = [];
  let curr = endStopId;

  while (previousLeg[curr]) {
    pathLegs.unshift(previousLeg[curr]);
    curr = previous[curr];
  }

  if (curr !== startStopId) {
    return null; // Não há rota disponível
  }

  return pathLegs;
};

// Formatação amigável de minutos para texto
const formatMinutes = (totalMin) => {
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins} min`;
};

// Formatação de Preço
const formatPrice = (minPrice, maxPrice) => {
  if (minPrice === 0 && maxPrice === 0) return 'Gratuito';
  if (minPrice === maxPrice) {
    return `R$ ${minPrice.toFixed(2).replace('.', ',')}`;
  }
  return `R$ ${minPrice.toFixed(2).replace('.', ',')} a R$ ${maxPrice.toFixed(2).replace('.', ',')}`;
};

// Função Principal: Planejar Rota Multimodal Completa
export const calculateRoute = (originInput, destInput, stops = [], legs = []) => {
  const startStop = resolveToStop(originInput, stops);
  const endStop = resolveToStop(destInput, stops);

  if (!startStop || !endStop) {
    return {
      found: false,
      message: 'Não foi possível identificar a origem ou o destino.',
    };
  }

  if (startStop.id === endStop.id) {
    return {
      found: false,
      sameLocation: true,
      message: 'A origem e o destino selecionados são o mesmo local!',
      startStop,
      endStop,
    };
  }

  // 1. Calcula a rota mais rápida (otimizando duration_min)
  const fastestLegs = dijkstra(startStop.id, endStop.id, stops, legs, 'duration_min');

  // 2. Calcula a rota mais barata (otimizando min_price)
  const cheapestLegs = dijkstra(startStop.id, endStop.id, stops, legs, 'min_price');

  if (!fastestLegs || fastestLegs.length === 0) {
    return {
      found: false,
      message: `Ainda não temos essa rota cadastrada no Litoral Sul da Bahia entre ${startStop.name} e ${endStop.name}.`,
      originName: startStop.name,
      destName: endStop.name,
      startStop,
      endStop,
    };
  }

  const buildRouteOption = (legsList, tag, subtitle) => {
    let totalMinutes = 0;
    let minPriceTotal = 0;
    let maxPriceTotal = 0;
    let hasUnconfirmed = false;
    let hasTideDependent = false;
    const polylineCoords = [];

    // Adiciona o nó inicial
    polylineCoords.push([startStop.lat, startStop.lng]);

    const formattedSteps = legsList.map((leg, index) => {
      totalMinutes += leg.duration_min || 0;
      minPriceTotal += leg.min_price || 0;
      maxPriceTotal += leg.max_price || 0;
      if (!leg.confirmed) hasUnconfirmed = true;
      if (leg.tide_dependent) hasTideDependent = true;

      const fromStop = stops.find((s) => s.id === leg.from_stop_id);
      const toStop = stops.find((s) => s.id === leg.to_stop_id);

      if (toStop) {
        polylineCoords.push([toStop.lat, toStop.lng]);
      }

      return {
        number: index + 1,
        legId: leg.id,
        title: leg.title,
        mode: leg.transport_mode,
        priceFormatted: formatPrice(leg.min_price, leg.max_price),
        minPrice: leg.min_price,
        maxPrice: leg.max_price,
        durationFormatted: formatMinutes(leg.duration_min),
        durationMin: leg.duration_min,
        pickupName: fromStop ? fromStop.name : 'Ponto de Embarque',
        dropoffName: toStop ? toStop.name : 'Ponto de Desembarque',
        frequency: leg.frequency_desc,
        firstDeparture: leg.first_departure,
        lastDeparture: leg.last_departure,
        paymentMethods: leg.payment_methods || ['Dinheiro vivo'],
        tideDependent: leg.tide_dependent,
        confirmed: leg.confirmed,
        lastVerified: leg.last_verified,
        notes: leg.notes,
      };
    });

    return {
      tag,
      subtitle,
      totalTime: formatMinutes(totalMinutes),
      totalMinutes,
      totalCostFormatted: formatPrice(minPriceTotal, maxPriceTotal),
      minPriceTotal,
      maxPriceTotal,
      hasUnconfirmed,
      hasTideDependent,
      stepsCount: legsList.length,
      steps: formattedSteps,
      legs: legsList,
      polylineCoords,
    };
  };

  const fastestOption = buildRouteOption(fastestLegs, 'Mais rápida', 'Menor tempo de deslocamento');
  
  // Verifica se a mais barata é significativamente diferente da mais rápida
  const isCheapestDifferent =
    cheapestLegs &&
    cheapestLegs.length > 0 &&
    cheapestLegs.map((l) => l.id).join(',') !== fastestLegs.map((l) => l.id).join(',');

  const cheapestOption = isCheapestDifferent
    ? buildRouteOption(cheapestLegs, 'Mais econômica', 'Menor custo total')
    : null;

  return {
    found: true,
    id: `route-${startStop.id}-${endStop.id}`,
    originName: startStop.name,
    destName: endStop.name,
    startStop,
    endStop,
    primaryRoute: fastestOption,
    alternativeRoute: cheapestOption,
    selectedOption: fastestOption,
  };
};
