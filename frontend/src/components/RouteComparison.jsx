import React from 'react';
import { Star, ShieldAlert, Clock, Compass, AlertTriangle, CheckCircle, ChevronRight, Zap } from 'lucide-react';

export default function RouteComparison({
  routes = [],
  selectedRouteId,
  onSelectRoute,
}) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Generated Route Options ({routes.length})</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          Ranked by Spotter Safety & Weather Hierarchy
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRec = route.is_recommended;
          const metrics = route.metrics || {};

          const severeMi = metrics.severe_miles || 0;
          const highMi = metrics.high_miles || 0;
          const modMi = metrics.moderate_miles || 0;
          const lowMi = metrics.low_miles || 0;
          const noTravelMi = metrics.no_travel_miles || 0;
          const avgScore = metrics.average_risk_score || 1.0;

          const hours = Math.floor(route.total_duration_hours);
          const mins = Math.round((route.total_duration_hours - hours) * 60);

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-[#141E34] border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl shadow-cyan-500/10'
                  : 'bg-[#101728] border-slate-800 hover:border-slate-700 hover:bg-[#131B2E]'
              }`}
            >
              {/* Recommended Badge */}
              {isRec && (
                <div className="absolute -top-3 left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-lg flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>Recommended Safest Route</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-2 mt-1">
                <div>
                  <div className="text-xs font-semibold text-slate-300">
                    Rank #{route.rank}: {route.name}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-white mt-1">
                    <span className="font-bold text-sm text-cyan-300">
                      {route.total_distance_miles} mi
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center space-x-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{hours}h {mins}m</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Avg Risk</div>
                  <div className={`text-sm font-bold font-mono ${
                    avgScore >= 3.5 ? 'text-red-400' : avgScore >= 2.5 ? 'text-orange-400' : avgScore >= 1.5 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {avgScore.toFixed(1)} / 5.0
                  </div>
                </div>
              </div>

              {/* Risk Exposure Miles Bar */}
              <div className="space-y-1.5 my-3">
                <div className="text-[10px] text-slate-400 flex justify-between font-medium">
                  <span>Weather Risk Mileage:</span>
                  <span>{route.checkpoints?.length || 0} checkpoints</span>
                </div>

                {/* Progress-style segment bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
                  {lowMi > 0 && (
                    <div style={{ width: `${(lowMi / route.total_distance_miles) * 100}%` }} className="bg-emerald-500" title={`Low Risk: ${lowMi} mi`} />
                  )}
                  {modMi > 0 && (
                    <div style={{ width: `${(modMi / route.total_distance_miles) * 100}%` }} className="bg-amber-400" title={`Moderate: ${modMi} mi`} />
                  )}
                  {highMi > 0 && (
                    <div style={{ width: `${(highMi / route.total_distance_miles) * 100}%` }} className="bg-orange-500" title={`High: ${highMi} mi`} />
                  )}
                  {severeMi > 0 && (
                    <div style={{ width: `${(severeMi / route.total_distance_miles) * 100}%` }} className="bg-red-500" title={`Severe: ${severeMi} mi`} />
                  )}
                  {noTravelMi > 0 && (
                    <div style={{ width: `${(noTravelMi / route.total_distance_miles) * 100}%` }} className="bg-rose-900" title={`NO TRAVEL: ${noTravelMi} mi`} />
                  )}
                </div>

                {/* Detailed Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                  {noTravelMi > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                      {noTravelMi} mi NO TRAVEL
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded border ${
                    severeMi > 0 ? 'bg-red-950/60 text-red-300 border-red-800 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}>
                    {severeMi} mi Severe
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border ${
                    highMi > 0 ? 'bg-orange-950/60 text-orange-300 border-orange-800' : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}>
                    {highMi} mi High
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/60">
                    {modMi} mi Mod
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/60">
                    {lowMi} mi Low
                  </span>
                </div>
              </div>

              {/* Recommendation Rationale */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-start space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{route.recommendation_reason}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
