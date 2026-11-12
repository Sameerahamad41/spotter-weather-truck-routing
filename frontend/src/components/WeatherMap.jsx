import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Wind, CloudRain, Snowflake, AlertTriangle, ShieldAlert, Clock, Scale } from 'lucide-react';

// Subcomponent to fit map bounds to route geometries
function MapBoundsUpdater({ routes, corridorPoints }) {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    const allCoords = [];
    routes.forEach((r) => {
      const coords = r.geometry?.coordinates || [];
      coords.forEach(([lon, lat]) => allCoords.push([lat, lon]));
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [routes, map]);

  return null;
}

export default function WeatherMap({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  corridorTimeline = {},
  forecastHourOffset = 0,
  heatmapMode = 'risk', // 'risk', 'wind', 'precip'
  showHeatmap = true,
}) {
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const corridorFrame = corridorTimeline[forecastHourOffset] || [];

  // Route colors
  const ROUTE_COLORS = {
    route_1: '#00D1FF', // Cyan
    route_2: '#A855F7', // Purple
    route_3: '#3B82F6', // Blue
  };

  // Helper for heatmap point styling based on mode
  const getHeatmapPointStyle = (pt) => {
    if (heatmapMode === 'wind') {
      const w = pt.wind_mph || 0;
      let color = '#10B981';
      if (w >= 55) color = '#7F1D1D';
      else if (w >= 45) color = '#EF4444';
      else if (w >= 35) color = '#F97316';
      else if (w >= 25) color = '#F59E0B';
      const radius = Math.min(38, Math.max(16, w * 0.7));
      return { color, radius, opacity: 0.42 };
    }

    if (heatmapMode === 'precip') {
      const rain = pt.rain_in_per_hr || 0;
      const snow = pt.snow_in_per_hr || 0;
      let color = '#38BDF8'; // Light sky blue
      let intensity = Math.max(rain, snow * 0.5);
      if (snow > 0) {
        color = '#E0F2FE'; // Snow white/cyan
        if (snow >= 2.0) color = '#EF4444';
        else if (snow >= 1.0) color = '#F97316';
      } else {
        if (rain >= 0.50) color = '#EF4444';
        else if (rain >= 0.25) color = '#F97316';
        else if (rain >= 0.10) color = '#F59E0B';
      }
      const radius = Math.min(36, Math.max(14, (rain + snow) * 20 + 12));
      return { color, radius, opacity: 0.45 };
    }

    // Default: Combined Risk Heatmap
    const radius = Math.min(36, Math.max(16, pt.risk_score * 7));
    return {
      color: pt.color || '#10B981',
      radius,
      opacity: 0.45,
    };
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-spotter-dark">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapBoundsUpdater routes={routes} corridorPoints={corridorFrame} />

        {/* High performance dark carto basemap */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* 1. Corridor Weather Heatmap Layer (0–48 hour slider forecast) */}
        {showHeatmap &&
          corridorFrame.map((pt, idx) => {
            const style = getHeatmapPointStyle(pt);
            return (
              <React.Fragment key={`corridor-${idx}`}>
                {/* Outer soft glow ring */}
                <CircleMarker
                  center={[pt.latitude, pt.longitude]}
                  radius={style.radius}
                  pathOptions={{
                    fillColor: style.color,
                    fillOpacity: style.opacity * 0.7,
                    stroke: false,
                  }}
                />
                {/* Inner core node */}
                <CircleMarker
                  center={[pt.latitude, pt.longitude]}
                  radius={Math.max(5, style.radius * 0.35)}
                  pathOptions={{
                    fillColor: style.color,
                    fillOpacity: 0.85,
                    color: '#FFFFFF',
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 space-y-1">
                      <div className="font-bold flex items-center justify-between gap-3 text-slate-100">
                        <span>Corridor Weather Node</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: `${pt.color}33`, color: pt.color }}
                        >
                          {pt.risk_level}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Forecast Time: +{forecastHourOffset}h from departure
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div>Wind: {pt.wind_mph} mph</div>
                        <div>Temp: {pt.temperature_f}°F</div>
                        <div>Rain: {pt.rain_in_per_hr} in/hr</div>
                        <div>Snow: {pt.snow_in_per_hr} in/hr</div>
                      </div>
                      {pt.notes && pt.notes.length > 0 && (
                        <div className="text-[10px] text-amber-300 pt-1 border-t border-slate-700">
                          {pt.notes[0]}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

        {/* 2. Inactive Routes Polylines (click to switch) */}
        {routes.map((route) => {
          if (route.id === selectedRouteId) return null;
          const coords = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);
          return (
            <Polyline
              key={route.id}
              positions={coords}
              pathOptions={{
                color: '#64748B',
                weight: 3.5,
                opacity: 0.5,
                dashArray: '6, 6',
              }}
              eventHandlers={{
                click: () => onSelectRoute(route.id),
              }}
            >
              <Tooltip sticky>
                <span className="text-xs font-semibold">{route.name} (Click to view)</span>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* 3. Active Route Polyline (Thick, glowing) */}
        {activeRoute && (
          <>
            {/* Outer glow line */}
            <Polyline
              positions={(activeRoute.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon])}
              pathOptions={{
                color: ROUTE_COLORS[activeRoute.id] || '#00D1FF',
                weight: 9,
                opacity: 0.35,
              }}
            />
            {/* Main vibrant line */}
            <Polyline
              positions={(activeRoute.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon])}
              pathOptions={{
                color: ROUTE_COLORS[activeRoute.id] || '#00D1FF',
                weight: 5,
                opacity: 0.95,
              }}
            />
          </>
        )}

        {/* 4. Checkpoints along Active Route */}
        {activeRoute?.checkpoints?.map((cp) => {
          const riskColor = cp.risk?.color || '#10B981';
          const isOrigin = cp.is_origin;
          const isDest = cp.is_destination;
          const weather = cp.weather || {};
          const risk = cp.risk || {};

          const radius = isOrigin || isDest ? 8 : 6;

          return (
            <CircleMarker
              key={`cp-${cp.index}`}
              center={[cp.latitude, cp.longitude]}
              radius={radius}
              pathOptions={{
                fillColor: riskColor,
                fillOpacity: 1,
                color: '#FFFFFF',
                weight: isOrigin || isDest ? 2.5 : 1.5,
              }}
            >
              <Popup>
                <div className="text-xs p-1.5 space-y-2 min-w-[220px]">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {isOrigin ? '📍 Origin' : isDest ? '🏁 Destination' : `Checkpoint #${cp.index}`}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${riskColor}33`, color: riskColor }}
                    >
                      {risk.overall_risk || 'Low'}
                    </span>
                  </div>

                  {/* Marker & Arrival ETA */}
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Mile Marker:</span>
                      <span className="font-mono font-semibold text-white">Mile {cp.mile_marker}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Truck ETA:</span>
                      <span className="font-mono font-semibold text-cyan-300">
                        {new Date(cp.eta_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (+{cp.eta_offset_hours}h)
                      </span>
                    </div>
                  </div>

                  {/* Weather Grid */}
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex items-center space-x-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{weather.wind_mph} mph</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-amber-400">🌡</span>
                      <span>{weather.temperature_f}°F</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                      <span>{weather.rain_in_per_hr} in/h</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-indigo-300" />
                      <span>{weather.snow_in_per_hr} in/h</span>
                    </div>
                  </div>

                  {/* Weather description */}
                  <div className="text-[11px] text-slate-300 italic">
                    Condition: {weather.condition || 'Fair'}
                  </div>

                  {/* Notes & Load Rule Warnings */}
                  {risk.notes && risk.notes.length > 0 && (
                    <div className="p-2 rounded bg-amber-950/60 border border-amber-800 text-[10px] text-amber-200 leading-snug space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Advisory / Load Penalty:</span>
                      </div>
                      {risk.notes.map((n, i) => (
                        <div key={i}>{n}</div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Map Overlay Badges */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-xl flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROUTE_COLORS[activeRoute?.id] || '#00D1FF' }} />
        <span className="font-semibold text-white">{activeRoute?.name || 'Active Route'}</span>
        <span className="text-slate-500">|</span>
        <span className="font-mono text-cyan-300">{activeRoute?.total_distance_miles} mi</span>
      </div>
    </div>
  );
}
