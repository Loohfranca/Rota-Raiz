import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { cachedWalk, fetchWalk, saveWalk, hasCoordinates } from '../lib/walking';
import 'leaflet/dist/leaflet.css';
function Fit({ points }) { const map = useMap(); useEffect(() => { map.fitBounds(points, { padding: [20, 20] }); }, [points, map]); return null; }
export default function WalkingPanel({ home, tour }) {
  const [result, setResult] = useState(() => cachedWalk(home, tour));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => !!cachedWalk(home, tour));
  const calculate = async () => {
    setLoading(true); setError(''); setResult(null); setSaved(false);
    try { const route = await fetchWalk(home, tour, AbortSignal.timeout(20000)); setResult(route); }
    catch (e) { setError(e.message || 'Não foi possível calcular a caminhada.'); }
    finally { setLoading(false); }
  };
  const save = () => { try { saveWalk(result); setSaved(true); } catch { setError('Não foi possível salvar: armazenamento do dispositivo indisponível ou cheio.'); } };
  const valid = hasCoordinates(home) && hasCoordinates(tour);
  const google = valid ? `https://www.google.com/maps/dir/?api=1&origin=${home.lat},${home.lng}&destination=${tour.lat},${tour.lng}&travelmode=walking` : null;
  return <section className="bg-[#f8f7f2] rounded-xl p-4 flex flex-col gap-3">
    <h3 className="text-sm font-bold">Percurso calculado desde sua origem</h3>
    <p className="text-xs text-[#777b6a]">{home?.name || 'Escolha sua origem em Passeios'} → {tour.title}</p>
      {!valid && <p className="text-sm">Volte a Passeios e escolha um endereço ou marque sua origem no mapa.</p>}
      <button disabled={!valid || loading} onClick={calculate} className="min-h-[44px] rounded-xl bg-[#2f5d3a] disabled:opacity-50 text-white p-3">{loading ? 'Calculando caminhada…' : 'Calcular desde minha origem'}</button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {result && <>
        <p className="font-bold">{result.km.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km no traçado automático · aproximadamente {Math.ceil(result.seconds / 60)} min</p>
        {result.hasFerry && <p className="text-sm bg-amber-50 rounded-xl p-3">O trajeto inclui travessia por água. O tempo é estimado e não garante operação ou horário de canoa/balsa.</p>}
        <p className="text-xs">Calculado em {new Date(result.calculatedAt).toLocaleString('pt-BR')} · Valhalla / OpenStreetMap</p>
        <div className="h-[360px] sm:h-[440px] w-full rounded-xl overflow-hidden">
          <MapContainer center={result.points[0]} zoom={13} className="h-full w-full">
            <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={result.points} color="#2f5d3a" /><CircleMarker center={result.points[0]} radius={8} color="#2563eb"><Popup>Saída: {home?.name}</Popup></CircleMarker><CircleMarker center={result.points[result.points.length - 1]} radius={8} color="#c2461f"><Popup>Chegada: {tour.title}</Popup></CircleMarker><Fit points={result.points} />
          </MapContainer>
        </div>
        <details><summary className="min-h-[44px] flex items-center font-bold cursor-pointer">Ver instruções da caminhada</summary><ol className="list-decimal pl-5 text-sm flex flex-col gap-2">{result.instructions.map((step, i) => <li key={i}>{step.text} · {Math.round(step.km * 1000)} m</li>)}</ol></details>
        <button onClick={save} className="min-h-[44px] rounded-xl border p-3">{saved ? 'Caminhada salva neste dispositivo' : 'Salvar caminhada e instruções'}</button>
        <p className="text-xs">Salva o traçado e as instruções para esta origem. O fundo do mapa não é baixado. Reabra o passeio em “Salvos” com a mesma origem para consultar.</p>
      </>}
      {google && <a href={google} target="_blank" rel="noopener noreferrer" className="min-h-[44px] flex items-center underline">Abrir caminhada no Google Maps</a>}
  </section>;
}
