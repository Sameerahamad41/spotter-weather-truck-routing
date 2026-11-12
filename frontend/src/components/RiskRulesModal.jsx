import React from 'react';
import { X, ShieldAlert, Scale, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function RiskRulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#10172A] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131E35]">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Spotter Truck Weather Risk Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Weather Thresholds Table */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Checkpoint Weather Classification Thresholds
            </h4>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-300 border-b border-slate-800 font-semibold">
                    <th className="p-2.5">Condition</th>
                    <th className="p-2.5 text-emerald-400">Low (1)</th>
                    <th className="p-2.5 text-amber-400">Moderate (2)</th>
                    <th className="p-2.5 text-orange-400">High (3)</th>
                    <th className="p-2.5 text-red-400">Severe (4)</th>
                    <th className="p-2.5 text-rose-300">No Travel (5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-white">Wind Speed</td>
                    <td className="p-2.5 text-emerald-300">&lt;25 mph</td>
                    <td className="p-2.5 text-amber-300">25–34 mph</td>
                    <td className="p-2.5 text-orange-300">35–44 mph</td>
                    <td className="p-2.5 text-red-300">45–54 mph</td>
                    <td className="p-2.5 font-bold text-rose-400">≥55 mph</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-white">Rain Precipitation</td>
                    <td className="p-2.5 text-emerald-300">&lt;0.10 in/hr</td>
                    <td className="p-2.5 text-amber-300">0.10–0.25 in/hr</td>
                    <td className="p-2.5 text-orange-300">0.25–0.50 in/hr</td>
                    <td className="p-2.5 text-red-300">0.50–1.00 in/hr</td>
                    <td className="p-2.5 font-bold text-rose-400">&gt;1.00 in/hr</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-white">Snowfall Rate</td>
                    <td className="p-2.5 text-emerald-300">&lt;0.5 in/hr</td>
                    <td className="p-2.5 text-amber-300">0.5–1.0 in/hr</td>
                    <td className="p-2.5 text-orange-300">1.0–2.0 in/hr</td>
                    <td className="p-2.5 text-red-300">2.0–3.0 in/hr</td>
                    <td className="p-2.5 font-bold text-rose-400">&gt;3.0 in/hr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Load Rules Overrides */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              Load Weight Overrides (Vehicle Dynamics)
            </h4>
            <div className="grid gap-2 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-rose-300">≥55 mph Wind:</strong>
                  <span className="text-slate-300 ml-1">→ Absolute <span className="text-rose-400 font-bold">No Travel</span> for any vehicle / load weight.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-900/60 flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-orange-300">45–54 mph Wind + &gt;30,000 lb Load:</strong>
                  <span className="text-slate-300 ml-1">→ Escalated to <span className="text-rose-400 font-bold">No Travel</span> (normally Severe). Extreme rollover & jackknife risk.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-amber-300">35–44 mph Wind + &gt;40,000 lb Load:</strong>
                  <span className="text-slate-300 ml-1">→ Escalated to <span className="text-red-400 font-bold">Severe</span> (normally High). Critical braking and lateral momentum load.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Recommendation Hierarchy */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Route Recommendation Hierarchy (Lexicographical Preference)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-slate-300">
              <li><strong className="text-white">Fewest Severe miles</strong> (and 0 No Travel miles prioritized lowest)</li>
              <li><strong className="text-white">Fewest High miles</strong></li>
              <li><strong className="text-white">Lowest average risk score</strong> (distance-weighted across route)</li>
              <li><strong className="text-white">Shortest travel times</strong> (fastest ETA)</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0E1526] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
