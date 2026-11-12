import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TripForm from './components/TripForm';
import RouteComparison from './components/RouteComparison';
import WeatherMap from './components/WeatherMap';
import ForecastSlider from './components/ForecastSlider';
import CheckpointTimeline from './components/CheckpointTimeline';
import RiskRulesModal from './components/RiskRulesModal';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { API_ENDPOINTS } from './api';

export default function App() {
  const [presets, setPresets] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [forecastHourOffset, setForecastHourOffset] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState('risk');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load presets on mount
  useEffect(() => {
    fetch(API_ENDPOINTS.PRESETS)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setPresets(data);
      })
      .catch((err) => console.warn('Could not load presets:', err));
  }, []);

  // Initial auto-run with Chicago -> Denver preset
  useEffect(() => {
    handleRunAnalysis({
      origin: { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
      destination: { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 },
      departure_time: new Date().toISOString(),
      load_weight_lbs: 38000,
      sampling_interval_miles: 25,
    });
  }, []);

  const handleRunAnalysis = async (params) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setAnalysisData(data);
      if (data.recommended_route_id) {
        setSelectedRouteId(data.recommended_route_id);
      } else if (data.routes && data.routes.length > 0) {
        setSelectedRouteId(data.routes[0].id);
      }
      setForecastHourOffset(0);
    } catch (err) {
      console.error('Route analysis error:', err);
      setErrorMessage(err.message || 'Failed to complete route analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoute = analysisData?.routes?.find((r) => r.id === selectedRouteId) || analysisData?.routes?.[0];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header onOpenRulesModal={() => setIsRulesModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-center space-x-2 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Trip Parameters Input Form */}
        <TripForm
          onSubmit={handleRunAnalysis}
          isLoading={isLoading}
          presets={presets}
        />

        {/* Section 2: Route Comparison Cards & Recommendation */}
        {analysisData && (
          <RouteComparison
            routes={analysisData.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        )}

        {/* Section 3: Interactive Map & Corridor Heatmap */}
        {analysisData && (
          <div className="space-y-4">
            <WeatherMap
              routes={analysisData.routes || []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              corridorTimeline={analysisData.corridor_timeline || {}}
              forecastHourOffset={forecastHourOffset}
              heatmapMode={heatmapMode}
              showHeatmap={showHeatmap}
            />

            {/* 0–48 Hour Forecast Slider & Heatmap Controls */}
            <ForecastSlider
              forecastHourOffset={forecastHourOffset}
              onChangeOffset={setForecastHourOffset}
              departureTimeStr={analysisData.departure_time}
              heatmapMode={heatmapMode}
              onChangeHeatmapMode={setHeatmapMode}
              showHeatmap={showHeatmap}
              onToggleShowHeatmap={() => setShowHeatmap(!showHeatmap)}
            />
          </div>
        )}

        {/* Section 4: Detailed Checkpoint Timeline */}
        {selectedRoute && (
          <CheckpointTimeline route={selectedRoute} />
        )}
      </main>

      {/* Rules & Reference Modal */}
      <RiskRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-[#0B0F19]">
        Spotter Assessment • Full Stack Weather-Aware Truck Routing • Built with React & Django
      </footer>
    </div>
  );
}
