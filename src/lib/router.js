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
    // Sem texto: sugere as cidades cadastradas (dados reais do banco, nada fixo no código)
    return cities.slice(0, 6).map((city) => {
      const mainStop = stops.find((st) => st.city_id === city.id);
      return {
        id: `city-${city.id}`,
        name: city.name,
        subtitle: 'Cidade',
        type: 'city',
        stopId: mainStop?.id,
        lat: city.lat,
        lng: city.lng,
      };
    });
  }

  const results = [];
  const seenIds = new Set();

  // 1. Cidades
  cities.forEach((city) => {
    if (normalizeText(city.name).includes(normalizedQuery)) {
      // Pega a parada principal da cidade
      const mainStop = stops.find((s) => s.city_id === city.id);
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

// Distância máxima (km) para considerar que um ponto "é" uma parada cadastrada
export const NEAR_STOP_KM = 2;

// Resolve um ponto escolhido pelo usuário ({ name, lat, lng, stopId }) para uma parada do grafo.
// Retorna { stop, distanceKm, exact } ou null se o lugar não for reconhecido.
export const resolvePoint = (point, stops = [], places = [], cities = []) => {
  if (!point) return null;

  // 1. Parada escolhida diretamente
  if (point.stopId) {
    const direct = stops.find((s) => s.id === point.stopId);
    if (direct) return { stop: direct, distanceKm: 0, exact: true };
  }

  // 2. Coordenadas (GPS, passeio, cidade ou lugar do mapa): parada mais próxima
  if (point.lat != null && point.lng != null) {
    const closest = findClosestStop(point.lat, point.lng, stops);
    if (!closest) return null;
    return { stop: closest, distanceKm: closest.distanceKm, exact: closest.distanceKm <= NEAR_STOP_KM };
  }

  // 3. Texto digitado sem escolher da lista: tenta casar exatamente com algo cadastrado
  const q = normalizeText(point.name);
  if (!q) return null;

  const stop = stops.find((s) => normalizeText(s.name) === q || normalizeText(s.short_name) === q);
  if (stop) return { stop, distanceKm: 0, exact: true };

  const city = cities.find((c) => normalizeText(c.name) === q);
  if (city) {
    const cityStop = stops.find((s) => s.city_id === city.id);
    if (cityStop) return { stop: cityStop, distanceKm: 0, exact: true };
  }

  const place = places.find((p) => normalizeText(p.title) === q);
  if (place) {
    const placeStop = stops.find((s) => s.id === place.closest_stop_id);
    if (placeStop) return { stop: placeStop, distanceKm: 0, exact: true };
  }

  return null;
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
export const calculateRoute = (originPoint, destPoint, stops = [], legs = [], places = [], cities = []) => {
  const origin = resolvePoint(originPoint, stops, places, cities);
  const dest = resolvePoint(destPoint, stops, places, cities);

  if (!origin) {
    return { found: false, reason: 'unknown', side: 'origin', message: `Não encontrei "${originPoint?.name || ''}". Escolha uma opção da lista.` };
  }
  if (!dest) {
    return { found: false, reason: 'unknown', side: 'dest', message: `Não encontrei "${destPoint?.name || ''}". Escolha uma opção da lista.` };
  }

  // Lugar existe no mapa, mas não há transporte cadastrado por perto
  if (!origin.exact || !dest.exact) {
    const side = !origin.exact ? 'origin' : 'dest';
    const info = side === 'origin' ? origin : dest;
    const name = side === 'origin' ? originPoint.name : destPoint.name;
    return {
      found: false,
      reason: 'no-coverage',
      side,
      placeName: name,
      nearestStop: info.stop,
      nearestKm: info.distanceKm,
      message: `Ainda não temos transporte cadastrado em ${name}.`,
    };
  }

  if (origin.stop.id === dest.stop.id) {
    return {
      found: false,
      reason: 'same',
      message: 'A origem e o destino são o mesmo local.',
      startStop: origin.stop,
      endStop: dest.stop,
    };
  }

  // Pontos por coordenada (GPS, cidade) podem estar perto de mais de uma parada: testa as próximas
  const nearbyCandidates = (point, resolved) => {
    if (point.stopId || point.lat == null || point.lng == null) return [resolved.stop];
    const list = stops
      .map((st) => ({ st, d: haversineDistance(point.lat, point.lng, st.lat, st.lng) }))
      .filter((x) => x.d <= NEAR_STOP_KM)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .map((x) => x.st);
    return list.length ? list : [resolved.stop];
  };

  let startStop = origin.stop;
  let endStop = dest.stop;
  {
    let bestMinutes = Infinity;
    for (const a of nearbyCandidates(originPoint, origin)) {
      for (const b of nearbyCandidates(destPoint, dest)) {
        if (a.id === b.id) continue;
        const path = dijkstra(a.id, b.id, stops, legs, 'duration_min');
        if (!path || path.length === 0) continue;
        const minutes = path.reduce((sum, l) => sum + (l.duration_min || 0), 0);
        if (minutes < bestMinutes) {
          bestMinutes = minutes;
          startStop = a;
          endStop = b;
        }
      }
    }
  }

  if (startStop.id === endStop.id) {
    return {
      found: false,
      reason: 'same',
      message: 'A origem e o destino são o mesmo local.',
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
      reason: 'no-route',
      message: `Ainda não temos rota cadastrada entre ${startStop.name} e ${endStop.name}.`,
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
