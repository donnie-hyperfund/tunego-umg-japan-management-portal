"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface GeofencePreviewProps {
  geofenceType: "circle" | "polygon" | null;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  polygon: Array<[number, number]> | null;
}

// Component to fit map bounds to geofence and render geofence layers
function GeofenceRenderer({
  geofenceType,
  latitude,
  longitude,
  radius,
  polygon,
}: GeofencePreviewProps) {
  const map = useMap();
  const layerRef = useRef<L.Circle | L.Polygon | null>(null);

  useEffect(() => {
    if (!map) return;

    // Wait for map to be fully ready
    const timeoutId = setTimeout(() => {
      // Remove existing layer if any
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      // Add geofence layer
      if (geofenceType === "circle" && latitude !== null && longitude !== null && radius !== null) {
        const circle = L.circle([latitude, longitude], {
          radius,
          color: "#00A0FF",
          fillColor: "#00A0FF",
          fillOpacity: 0.2,
        });
        circle.addTo(map);
        layerRef.current = circle;
        map.fitBounds(circle.getBounds().pad(0.2));
      } else if (geofenceType === "polygon" && polygon && polygon.length > 0) {
        const polygonLayer = L.polygon(polygon, {
          color: "#00A0FF",
          fillColor: "#00A0FF",
          fillOpacity: 0.2,
        });
        polygonLayer.addTo(map);
        layerRef.current = polygonLayer;
        map.fitBounds(polygonLayer.getBounds().pad(0.2));
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, geofenceType, latitude, longitude, radius, polygon]);

  return null;
}

export default function GeofencePreview({
  geofenceType,
  latitude,
  longitude,
  radius,
  polygon,
}: GeofencePreviewProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-48 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#00A0FF] mb-2"></div>
          <p className="text-[#AAAAAA] text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Calculate center for map
  let centerLat = 36.1699; // Default to Las Vegas
  let centerLng = -115.1398;

  if (geofenceType === "circle" && latitude !== null && longitude !== null) {
    centerLat = latitude;
    centerLng = longitude;
  } else if (geofenceType === "polygon" && polygon && polygon.length > 0) {
    const lats = polygon.map((p) => p[0]);
    const lngs = polygon.map((p) => p[1]);
    centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
  }

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-[#1A1A1A]">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeofenceRenderer
          geofenceType={geofenceType}
          latitude={latitude}
          longitude={longitude}
          radius={radius}
          polygon={polygon}
        />
      </MapContainer>
    </div>
  );
}
