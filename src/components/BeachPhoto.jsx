import React, { useState } from "react";
import { Waves, TreePalm } from "lucide-react";
export default function BeachPhoto({ tour, className = "" }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`beach-photo ${className}`}>
      {tour.photo && !failed ? (
        <img
          src={tour.photo.url}
          alt={tour.title}
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="landscape-placeholder"
          aria-label={`Guia de ${tour.title}`}
        >
          <span className="landscape-sun" />
          <span className="landscape-coast" />
          <TreePalm size={42} strokeWidth={1.2} />
          <Waves size={80} strokeWidth={0.7} className="landscape-waves" />
        </div>
      )}
    </div>
  );
}
