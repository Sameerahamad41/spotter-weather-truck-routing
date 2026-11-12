import React, { useState } from 'react';
import { Route, Wind, CloudRain, Snowflake, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';

export default function CheckpointTimeline({ route }) {
  const [filter, setFilter] = useState('all'); // 'all', 'adverse', 'severe'

  if (!route || !route.checkpoints || route.checkpoints.length === 0) {
    return null;
  }

  const checkpoints = route.checkpoints;

  const filteredCheckpoints = checkpoints.filter((cp) => {
    const risk = cp.risk?.overall_risk;
    if (filter === 'severe') {
      return risk === 'Severe' || risk === 'No Travel';
    }
    if (filter === 'adverse') {
      return risk === 'Moderate' || risk === 'High' || risk === 'Severe' || risk === 'No Travel';
    }
    return true;
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-cyan-400" />
            <span>Route Checkpoint Weather Timeline ({checkpoints.length} Checkpoints)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Chronological checkpoints sampled along {route.name} at truck's calculated arrival times
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === 'all'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All ({checkpoints.length})
          </button>
          <button
            onClick={() => setFilter('adverse')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === 'adverse'
                ? 'bg-amber-950 text-amber-300 font-medium border border-amber-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Adverse Weather
          </button>
          <button
            onClick={() => setFilter('severe')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === 'severe'
                ? 'bg-red-950 text-red-300 font-medium border border-red-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Severe & No Travel Only
          </button>
        </div>
      </div>

      {/* Checkpoint Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[360px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#162032] text-slate-300 font-semibold sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="p-2.5">Checkpoint</th>
              <th className="p-2.5">Mile Marker</th>
              <th className="p-2.5">Arrival Time (ETA)</th>
              <th className="p-2.5">Wind</th>
              <th className="p-2.5">Rain</th>
              <th className="p-2.5">Snow</th>
              <th className="p-2.5">Temp & Condition</th>
              <th className="p-2.5">Risk Level</th>
              <th className="p-2.5">Load & Weather Advisory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-[11px] text-slate-300">
            {filteredCheckpoints.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-slate-400 font-sans">
                  No checkpoints match the selected filter.
                </td>
              </tr>
            ) : (
              filteredCheckpoints.map((cp) => {
                const w = cp.weather || {};
                const r = cp.risk || {};
                const riskColor = r.color || '#10B981';
                const hasNotes = r.notes && r.notes.length > 0;

                return (
                  <tr
                    key={cp.index}
                    className={`hover:bg-[#1A253C]/70 transition ${
                      r.overall_risk === 'No Travel'
                        ? 'bg-rose-950/20'
                        : r.overall_risk === 'Severe'
                        ? 'bg-red-950/15'
                        : ''
                    }`}
                  >
                    <td className="p-2.5 font-sans font-medium text-white whitespace-nowrap">
                      {cp.is_origin ? '📍 Origin' : cp.is_destination ? '🏁 Destination' : `#${cp.index}`}
                    </td>
                    <td className="p-2.5 text-cyan-300 font-bold whitespace-nowrap">
                      {cp.mile_marker} mi
                    </td>
                    <td className="p-2.5 text-slate-200 whitespace-nowrap">
                      {new Date(cp.eta_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-slate-400 ml-1.5">(+{cp.eta_offset_hours}h)</span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className={`font-semibold ${w.wind_mph >= 45 ? 'text-red-400' : w.wind_mph >= 35 ? 'text-orange-400' : 'text-slate-200'}`}>
                        {w.wind_mph} mph
                      </span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className={w.rain_in_per_hr >= 0.5 ? 'text-red-400 font-bold' : w.rain_in_per_hr >= 0.25 ? 'text-orange-400' : 'text-slate-300'}>
                        {w.rain_in_per_hr} in/h
                      </span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className={w.snow_in_per_hr >= 2.0 ? 'text-red-400 font-bold' : w.snow_in_per_hr >= 1.0 ? 'text-orange-400' : 'text-slate-300'}>
                        {w.snow_in_per_hr} in/h
                      </span>
                    </td>
                    <td className="p-2.5 font-sans whitespace-nowrap">
                      <span className="text-slate-200 font-mono">{w.temperature_f}°F</span>
                      <span className="text-slate-400 ml-1.5">• {w.condition}</span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block"
                        style={{ backgroundColor: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}55` }}
                      >
                        {r.overall_risk || 'Low'}
                      </span>
                    </td>
                    <td className="p-2.5 font-sans text-[11px]">
                      {hasNotes ? (
                        <div className="text-amber-300 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-400" />
                          <span>{r.notes[0]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Normal travel</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
