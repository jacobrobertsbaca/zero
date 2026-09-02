"use client";

import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

type TransactionLocationMapProps = {
  lat: number;
  lng: number;
};

export const TransactionLocationMap = ({ lat, lng }: TransactionLocationMapProps) => {
  return (
    <div className="transaction-map relative h-40 w-full border-t border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2rde_1_5ad4dfaba7633b33f5974e16"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <CircleMarker
          center={[lat, lng]}
          radius={4}
          pathOptions={{
            color: "hsl(var(--primary))",
            fillColor: "white",
            fillOpacity: 1,
            weight: 3,
          }}
        />
      </MapContainer>
      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="absolute inset-0 bg-background/15" />
        <p className="absolute bottom-1 right-2 text-[9px] text-muted-foreground/70">© OSM/Carto</p>
      </div>
    </div>
  );
};
