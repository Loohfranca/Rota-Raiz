export function createInternalPlaceSearch(client) {
  async function request(name, args, signal) {
    if (!client) throw new Error("Conecte-se para consultar os lugares do Rota Raiz.");
    let query = client.rpc(name, args);
    if (signal && query.abortSignal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw new Error(["PGRST202", "42883"].includes(error.code)
      ? "A busca interna ainda precisa ser ativada no banco."
      : "Não foi possível consultar os lugares. Tente novamente.");
    return data;
  }
  return {
    nearby({lat,lng},signal) {return request("rr_nearby_places",{p_lat:lat,p_lng:lng},signal);},
    completeLegacy(sourceId,data) {return request("rr_complete_legacy_place",{p_source:sourceId,p:data});},
    search(query, { destinationId = null, signal } = {}) {
      if (!query.trim() && !destinationId) return Promise.resolve([]);
      return request("rr_search_places", { p_query: query.slice(0, 80), p_limit: 8, p_destination_id: destinationId }, signal);
    },
    async getPlace(id, signal) {
      const place = await request("rr_get_internal_place", { p_id: id }, signal);
      if (!place) throw new Error("Este lugar não está mais disponível. Escolha outro.");
      return place;
    },
    duplicates({ name, address = "", city = "", state = "", lat = null, lng = null }, signal) {
      if (!name.trim()) return Promise.resolve([]);
      return request("rr_find_place_duplicates", { p_name: name.slice(0, 120), p_address: address.slice(0, 300),
        p_municipality: city.slice(0, 120), p_state: state.slice(0, 60), p_lat: lat, p_lng: lng }, signal);
    },
  };
}
export function cityAndState(value, explicitState = "") {
  const match = value.trim().match(/^(.*?)[,\s-]+([A-Za-z]{2})$/);
  const ufs = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
  return explicitState.trim() ? { city: value.trim(), state: explicitState.trim() }
    : match && ufs.has(match[2].toUpperCase()) ? { city: match[1].trim(), state: match[2].toUpperCase() } : { city: value.trim(), state: "" };
}
