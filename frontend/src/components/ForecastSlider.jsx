import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Flame, Wind, CloudRain, Layers, Eye, EyeOff } from 'lucide-react';

export default function ForecastSlider({
  forecastHourOffset,
  onChangeOffset,
  departureTimeStr,
  heatmapMode,
  onChangeHeatmapMode,
  showHeatmap,
  onToggleShowHeatmap,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play animation through 0 to 48 hours
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onChangeOffset((prev) => {
          if (prev >= 48) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlaying, onChangeOffset]);

  // Compute calculated forecast clock time
  const baseTime = departureTimeStr ? new Date(departureTimeStr) : new Date();
  const futureTime = new Date(baseTime.getTime() + forecastHourOffset * 3600 * 1000);
  const formattedTime = futureTime.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Top Header & Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Trip Corridor Weather Heatmap</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                0–48h Timeline
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Scrub to project storm fronts, blizzard bands & crosswind gusts across the trip corridor
            </div>
          </div>
        </div>

        {/* Mode selector pills & visibility toggle */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Heatmap Layer Mode */}
          <div className="flex bg-[#162032] p-1 rounded-xl border border-slate-700 text-xs font-medium">
            <button
              onClick={() => onChangeHeatmapMode('risk')}
              className={`px-2.5 py-1 rounded-lg transition ${
                heatmapMode === 'risk' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Risk
            </button>
            <button
              onClick={() => onChangeHeatmapMode('wind')}
              className={`px-2.5 py-1 rounded-lg transition ${
                heatmapMode === 'wind' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Wind
            </button>
            <button
              onClick={() => onChangeHeatmapMode('precip')}
              className={`px-2.5 py-1 rounded-lg transition ${
                heatmapMode === 'precip' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Precip
            </button>
          </div>

          {/* Toggle Heatmap Overlay on/off */}
          <button
            onClick={onToggleShowHeatmap}
            className={`p-1.5 rounded-xl border text-xs transition flex items-center gap-1 ${
              showHeatmap
                ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={showHeatmap ? 'Hide Corridor Heatmap' : 'Show Corridor Heatmap'}
          >
            {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slider & Play Controls */}
      <div className="bg-[#162032] p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Play/Pause Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
            title={isPlaying ? 'Pause' : 'Play 48h Weather Animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onChangeOffset(0);
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition"
            title="Reset to Departure (+0h)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Range Slider */}
        <div className="flex-1 w-full space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-cyan-300 font-bold text-sm">
              +{forecastHourOffset} Hours
            </span>
            <span className="text-slate-300 font-medium text-xs bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              📅 {formattedTime}
            </span>
            <span className="font-mono text-slate-400 text-xs">+48h Max</span>
          </div>

          <input
            type="range"
            min="0"
            max="48"
            step="2"
            value={forecastHourOffset}
            onChange={(e) => {
              setIsPlaying(false);
              onChangeOffset(Number(e.target.value));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {/* Quick hour milestones */}
          <div className="flex justify-between text-[10px] text-slate-400 px-1 pt-0.5 font-mono">
            {[0, 6, 12, 18, 24, 30, 36, 42, 48].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  onChangeOffset(h);
                }}
                className={`hover:text-cyan-300 transition ${forecastHourOffset === h ? 'text-cyan-400 font-bold' : ''}`}
              >
                +{h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Risk Scale Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
        <span className="font-semibold text-slate-300">Corridor Risk Scale:</span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Low (&lt;25 mph)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Mod (25–34)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>High (35–44)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Severe (45–54)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-900"></span>
            <span className="font-bold text-rose-300">No Travel (≥55)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
