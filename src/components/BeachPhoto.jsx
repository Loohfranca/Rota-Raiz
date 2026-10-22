import React, { useState } from 'react';
import { Waves } from 'lucide-react';
export default function BeachPhoto({ tour, className = '' }) {
  const [failed, setFailed] = useState(false);
  return <div className={`relative overflow-hidden bg-[#d9e9e4] ${className}`}>
    {tour.photo && !failed ? <img src={tour.photo.url} alt={tour.title} onError={()=>setFailed(true)} loading="lazy" className="absolute inset-0 w-full h-full object-cover"/> : <div className="absolute inset-0 bg-gradient-to-br from-[#afc8bd] via-[#d2dfcd] to-[#eddfc6] flex items-center justify-center"><Waves size={52} strokeWidth={1} className="text-[#2f5d3a]/40"/></div>}
  </div>;
}
