import React, { useState } from "react";
import { getTourPhotos } from "../lib/photos";
import { Waves, TreePalm } from "lucide-react";
export default function BeachPhoto({ tour, className = "" }) {
  const [failed, setFailed] = useState([]);
  const photo = getTourPhotos(tour).find(item => !failed.includes(item.url));
  return (
    <div className={`beach-photo ${className}`}>
      {photo ? (
        <img
          src={photo.url}
          alt={tour.title}
          onError={() => setFailed(previous => [...previous, photo.url])}
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
