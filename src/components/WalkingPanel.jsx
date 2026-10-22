import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { cachedWalk, fetchWalk, saveWalk, hasCoordinates } from '../lib/walking';
import 'leaflet/dist/leaflet.css';
function Fit({ points }) { const map = useMap(); useEffect(() => { map.fitBounds(points, { padding: [20, 20] }); }, [points, map]); return null; }
export default function WalkingPanel({ home, tour, onSwitchToRoute }) {
  const [mode, setMode] = useState('walk');
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
  return <section className="bg-white rounded-2xl border border-[#e0d5c1] p-4 flex flex-col gap-3">
    <h2 className="text-lg font-bold">Como chegar</h2>
    <p className="text-sm">Saindo de: <strong>{home?.name || 'Escolha sua origem em Passeios'}</strong></p>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Modo de viagem">
      <button aria-pressed={mode === 'walk'} onClick={() => setMode('walk')} className={`min-h-[44px] rounded-xl p-2 ${mode === 'walk' ? 'bg-[#2f5d3a] text-white' : 'bg-[#f7ece2]'}`}>A pé</button>
      <button aria-pressed={mode === 'transit'} onClick={() => setMode('transit')} className={`min-h-[44px] rounded-xl p-2 ${mode === 'transit' ? 'bg-[#2f5d3a] text-white' : 'bg-[#f7ece2]'}`}>Van / ônibus</button>
    </div>
    {mode === 'transit' ? <><p className="text-sm">Consulte os trechos de transporte cadastrados. Distâncias e horários dependem dos dados disponíveis.</p><button onClick={() => onSwitchToRoute(tour.title)} className="min-h-[44px] rounded-xl bg-[#c2461f] text-white p-3">Consultar transporte</button></> : <>
      <p className="text-sm">O percurso usa ruas e caminhos mapeados no OpenStreetMap. Distância e tempo são estimativas; acessos por praia, maré e travessias precisam ser conferidos no local.</p>
      <button disabled={!valid || loading} onClick={calculate} className="min-h-[44px] rounded-xl bg-[#2f5d3a] disabled:opacity-50 text-white p-3">{loading ? 'Calculando caminhada…' : 'Calcular percurso a pé'}</button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {result && <>
        <p className="font-bold">{result.km.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km a pé · aproximadamente {Math.ceil(result.seconds / 60)} min</p>
        <p className="text-xs">Calculado em {new Date(result.calculatedAt).toLocaleString('pt-BR')} · Valhalla / OpenStreetMap</p>
        <div className="h-72 w-full rounded-xl overflow-hidden">
          <MapContainer center={result.points[0]} zoom={13} className="h-full w-full">
            <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={result.points} color="#2f5d3a" /><CircleMarker center={result.points[0]} radius={6} /><CircleMarker center={result.points[result.points.length - 1]} radius={6} /><Fit points={result.points} />
          </MapContainer>
        </div>
        <ol className="list-decimal pl-5 text-sm flex flex-col gap-2">{result.instructions.map((step, i) => <li key={i}>{step.text} · {Math.round(step.km * 1000)} m</li>)}</ol>
        <button onClick={save} className="min-h-[44px] rounded-xl border p-3">{saved ? 'Caminhada salva neste dispositivo' : 'Salvar caminhada e instruções'}</button>
        <p className="text-xs">Salva o traçado e as instruções para esta origem. O fundo do mapa não é baixado. Reabra o passeio em “Salvos” com a mesma origem para consultar.</p>
      </>}
      {google && <a href={google} target="_blank" rel="noopener noreferrer" className="min-h-[44px] flex items-center underline">Abrir caminhada no Google Maps</a>}
    </>}
  </section>;
}
