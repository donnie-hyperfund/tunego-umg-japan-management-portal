"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Marker, Polygon, useMap } from "react-leaflet";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export type GeofenceType = "circle" | "polygon";

interface MapPickerProps {
  geofenceType: GeofenceType | null;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  polygon: Array<[number, number]> | null; // Array of [lat, lng] coordinates
  onGeofenceTypeChange: (type: GeofenceType) => void;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  onPolygonChange: (polygon: Array<[number, number]>) => void;
}

// Component to update map center when location changes
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to initialize geofence when map is ready
function GeofenceInitializer({
  featureGroup,
  geofenceType,
  latitude,
  longitude,
  radius,
  polygon,
  onLayerSet,
}: {
  featureGroup: L.FeatureGroup | null;
  geofenceType: "circle" | "polygon";
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  polygon: Array<[number, number]> | null;
  onLayerSet: (layer: L.Circle | L.Polygon | null) => void;
}) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!featureGroup) {
      return;
    }

    if (initializedRef.current) {
      return;
    }

    // Wait for map to be fully ready
    const timeoutId = setTimeout(() => {
      // Only clear layers if we're initializing from existing data (not from user drawing)
      // If there are already layers, they might be from user drawing, so don't clear them
      const existingLayers = featureGroup.getLayers();
      if (existingLayers.length > 0) {
        // There are existing layers - user might have drawn something new
        initializedRef.current = true;
        return;
      }
      
      // Clear any existing layer (only if we got here, meaning no layers exist)
      featureGroup.clearLayers();

      // Add existing geofence if we have valid data
      if (geofenceType === "circle" && latitude !== null && longitude !== null && radius !== null && radius > 0) {
        const circle = L.circle([latitude, longitude], {
          radius: radius,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
        });
        featureGroup.addLayer(circle);
        onLayerSet(circle);
        initializedRef.current = true;
      } else if (geofenceType === "polygon" && polygon && polygon.length > 0) {
        const polygonLayer = L.polygon(polygon, {
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
        });
        featureGroup.addLayer(polygonLayer);
        onLayerSet(polygonLayer);
        initializedRef.current = true;
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [featureGroup, geofenceType, latitude, longitude, radius, polygon, onLayerSet, map]);

  // Reset when geofence data changes, but only if we're loading from props (not user interaction)
  // If FeatureGroup has layers, those are from user drawing, so don't reset
  useEffect(() => {
    // Check if FeatureGroup has layers - if it does, user might have just drawn something
    // Don't reset in that case to preserve user-drawn shapes
    if (featureGroup && featureGroup.getLayers().length > 0) {
      return;
    }
    
    initializedRef.current = false;
  }, [geofenceType, latitude, longitude, radius, polygon, featureGroup]);

  return null;
}

export default function MapPicker({
  geofenceType,
  latitude,
  longitude,
  radius,
  polygon,
  onGeofenceTypeChange,
  onLocationChange,
  onRadiusChange,
  onPolygonChange,
}: MapPickerProps) {
  const [mapReady, setMapReady] = useState(false);
  const [featureGroupReady, setFeatureGroupReady] = useState(false);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const existingLayerRef = useRef<L.Circle | L.Polygon | null>(null);
  const mapRef = useRef<L.Map | null>(null);


  // Default to Las Vegas, NV (based on memory about scheduler city)
  const defaultLat = 36.1699;
  const defaultLng = -115.1398;

  const currentType = geofenceType ?? "circle";
  
  // Calculate center for polygon if we have one
  let currentLat = latitude ?? defaultLat;
  let currentLng = longitude ?? defaultLng;
  
  if (currentType === "polygon" && polygon && polygon.length > 0) {
    // Calculate center of polygon bounds
    const lats = polygon.map((p) => p[0]);
    const lngs = polygon.map((p) => p[1]);
    currentLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    currentLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
  } else if (!latitude || !longitude) {
    currentLat = defaultLat;
    currentLng = defaultLng;
  }
  
  const currentRadius = radius ?? 100; // Default 100 meters
  const currentPolygon = polygon ?? null;

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Callback to set FeatureGroup ref
  const setFeatureGroup = (fg: L.FeatureGroup | null) => {
    featureGroupRef.current = fg;
    setFeatureGroupReady(!!fg);
  };

  // Callback to set the layer reference
  const setLayerRef = (layer: L.Circle | L.Polygon | null) => {
    existingLayerRef.current = layer;
  };

  const handleCreated = (e: L.DrawEvents.Created) => {
    const { layerType, layer } = e;
    
    // Clear existing layer reference
    if (existingLayerRef.current && featureGroupRef.current) {
      featureGroupRef.current.removeLayer(existingLayerRef.current);
      existingLayerRef.current = null;
    }
    
    if (layerType === "circle") {
      const circle = layer as L.Circle;
      const center = circle.getLatLng();
      const radius = circle.getRadius();
      onLocationChange(center.lat, center.lng);
      onRadiusChange(Math.round(radius));
      onGeofenceTypeChange("circle");
      existingLayerRef.current = circle;
    } else if (layerType === "polygon") {
      const polygonLayer = layer as L.Polygon;
      try {
        const latlngs = polygonLayer.getLatLngs()[0] as L.LatLng[];
        if (!latlngs || latlngs.length === 0) {
          console.error("[MapPicker] Polygon has no coordinates!");
          return;
        }
        const coordinates: Array<[number, number]> = latlngs.map((ll) => [ll.lat, ll.lng]);
        onPolygonChange(coordinates);
        onGeofenceTypeChange("polygon");
        existingLayerRef.current = polygonLayer;
      } catch (error) {
        console.error("[MapPicker] Error extracting polygon coordinates:", error);
      }
    }
  };

  const handleEdited = (e: L.DrawEvents.Edited) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        onLocationChange(center.lat, center.lng);
        onRadiusChange(Math.round(radius));
        onGeofenceTypeChange("circle");
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const coordinates: Array<[number, number]> = latlngs.map((ll) => [ll.lat, ll.lng]);
        onPolygonChange(coordinates);
        onGeofenceTypeChange("polygon");
      }
    });
  };

  const handleDeleted = () => {
    if (existingLayerRef.current && featureGroupRef.current) {
      featureGroupRef.current.removeLayer(existingLayerRef.current);
      existingLayerRef.current = null;
    }
    if (currentType === "circle") {
      onLocationChange(defaultLat, defaultLng);
      onRadiusChange(100);
    } else {
      onPolygonChange([]);
    }
  };

  if (!mapReady) {
    return (
      <div className="w-full h-96 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A0FF] mb-4"></div>
          <p className="text-[#AAAAAA]">Loading map...</p>
        </div>
      </div>
    );
  }

  const drawOptions: L.Control.DrawConstructorOptions = {
    position: "topright",
    draw: {
      circle: currentType === "circle" ? {} : false,
      polygon: currentType === "polygon" ? {} : false,
      rectangle: false,
      marker: false,
      circlemarker: false,
      polyline: false,
    },
    edit: featureGroupReady && featureGroupRef.current
      ? {
          featureGroup: featureGroupRef.current,
          remove: true,
        }
      : {
          featureGroup: featureGroupRef.current || ({} as L.FeatureGroup),
          remove: false,
        },
  };

  return (
    <div className="w-full space-y-6">
      {/* Geofence Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-3 text-[#CCCCCC]">Geofence Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="geofenceType"
              value="circle"
              checked={currentType === "circle"}
              onChange={() => {
                onGeofenceTypeChange("circle");
                if (featureGroupRef.current) {
                  featureGroupRef.current.clearLayers();
                }
                existingLayerRef.current = null;
              }}
              className="w-4 h-4 cursor-pointer accent-[#00A0FF]"
            />
            <span className="text-[#AAAAAA] group-hover:text-white transition-colors">Circle</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="geofenceType"
              value="polygon"
              checked={currentType === "polygon"}
              onChange={() => {
                onGeofenceTypeChange("polygon");
                if (featureGroupRef.current) {
                  featureGroupRef.current.clearLayers();
                }
                existingLayerRef.current = null;
              }}
              className="w-4 h-4 cursor-pointer accent-[#00A0FF]"
            />
            <span className="text-[#AAAAAA] group-hover:text-white transition-colors">Polygon</span>
          </label>
        </div>
      </div>

      {/* Map */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-[#1A1A1A] relative shadow-lg">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter center={[currentLat, currentLng]} />
          
          <FeatureGroup ref={setFeatureGroup}>
            {featureGroupReady && (
              <EditControl
                position="topright"
                onCreated={handleCreated}
                onEdited={handleEdited}
                onDeleted={handleDeleted}
                draw={{
                  circle: currentType === "circle" ? {} : false,
                  polygon: currentType === "polygon" ? {} : false,
                  rectangle: false,
                  marker: false,
                  circlemarker: false,
                  polyline: false,
                }}
                edit={{
                  remove: true,
                } as any}
              />
            )}
          </FeatureGroup>
          {featureGroupReady && featureGroupRef.current && (
            <GeofenceInitializer
              featureGroup={featureGroupRef.current}
              geofenceType={currentType}
              latitude={latitude}
              longitude={longitude}
              radius={radius}
              polygon={currentPolygon}
              onLayerSet={setLayerRef}
            />
          )}
        </MapContainer>
      </div>

      {/* Circle Controls */}
      {currentType === "circle" && (
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-[#CCCCCC]">Latitude</label>
            <input
              type="number"
              step="any"
              value={currentLat.toFixed(6)}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onLocationChange(lat, currentLng);
                }
              }}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3 text-[#CCCCCC]">Longitude</label>
            <input
              type="number"
              step="any"
              value={currentLng.toFixed(6)}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onLocationChange(currentLat, lng);
                }
              }}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3 text-[#CCCCCC]">
              Radius (meters)
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="10"
                max="100000"
                step="100"
                value={currentRadius}
                onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                className="w-full accent-[#00A0FF]"
              />
              <input
                type="number"
                min="10"
                max="100000"
                value={currentRadius}
                onChange={(e) => {
                  const r = parseInt(e.target.value);
                  if (!isNaN(r) && r >= 10 && r <= 100000) {
                    onRadiusChange(r);
                  }
                }}
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Polygon Info */}
      {currentType === "polygon" && currentPolygon && currentPolygon.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-3 text-[#CCCCCC]">
            Polygon Coordinates ({currentPolygon.length} points)
          </label>
          <div className="max-h-32 overflow-y-auto p-4 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-xs font-mono text-[#AAAAAA]">
            {currentPolygon.map((coord, idx) => (
              <div key={idx} className="py-1">
                [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-[#8A8A8A] leading-relaxed mt-2">
        {currentType === "circle"
          ? "Click the circle tool in the top-right corner, then click and drag on the map to draw a circle geofence. You can also adjust coordinates and radius manually."
          : "Click the polygon tool in the top-right corner, then click on the map to add points. Double-click to finish the polygon. You can edit or delete the polygon using the tools."}
      </p>
    </div>
  );
}
