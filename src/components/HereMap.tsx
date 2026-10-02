import { MapPin } from "lucide-react";

// En liten karta över entréplanet. Påhittad planlösning, ritad för att vara lätt att läsa.
const places = [
  { name: "Matsalen", x: 6, y: 6, w: 56, h: 44 },
  { name: "Trappa till rummen", short: "Trappa", x: 66, y: 6, w: 60, h: 44 },
  { name: "Lounge med öppen spis", short: "Lounge", x: 130, y: 6, w: 64, h: 44 },
  { name: "Bastu", x: 6, y: 54, w: 56, h: 34 },
  { name: "Skid- och torkrum", short: "Skidrum", x: 130, y: 54, w: 64, h: 34 },
];

export function HereMap() {
  return (
    <figure className="here-map" aria-labelledby="here-map-title">
      <figcaption id="here-map-title">
        <MapPin aria-hidden="true" /> Du är här: receptionen
      </figcaption>
      <svg viewBox="0 0 200 122" role="img" aria-labelledby="here-map-svg-title">
        <title id="here-map-svg-title">
          Karta över entréplanet. Receptionen ligger i mitten. Matsalen och bastun ligger till
          vänster, loungen och skidrummet till höger, trappan till rummen rakt fram och entrén
          nedanför.
        </title>
        <rect className="map-floor" x="2" y="2" width="196" height="102" rx="6" />
        {places.map((p) => (
          <g key={p.name}>
            <rect className="map-room" x={p.x} y={p.y} width={p.w} height={p.h} rx="3" />
            <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 3} textAnchor="middle">
              {p.short ?? p.name}
            </text>
          </g>
        ))}
        <rect className="map-here" x="66" y="54" width="60" height="34" rx="3" />
        <text className="map-here-label" x="96" y="68" textAnchor="middle">
          Reception
        </text>
        <circle className="map-pulse" cx="96" cy="78" r="5" />
        <circle className="map-dot" cx="96" cy="78" r="3.2" />
        <path className="map-door" d="M88 104 L104 104" />
        <text className="map-entry" x="96" y="117" textAnchor="middle">
          Entré
        </text>
      </svg>
    </figure>
  );
}
