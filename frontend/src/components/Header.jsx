import React from 'react';
import { Truck, ShieldCheck, Wind, CloudRain, AlertTriangle, Info } from 'lucide-react';

export default function Header({ onOpenRulesModal }) {
  return (
    <header className="border-b border-spotter-border bg-spotter-dark/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                <span className="text-cyan-400">spotter</span> Fleet
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                Weather-Aware Routing
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent truck navigation balancing weather severity, rollover physics & travel time
            </p>
          </div>
        </div>

        {/* Status Indicators & Action */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden md:flex items-center space-x-2 bg-spotter-card px-3 py-1.5 rounded-lg border border-spotter-border text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Open-Meteo API</span>
            <span className="text-slate-500">|</span>
            <span>OSRM Engine</span>
            <span className="text-slate-500">|</span>
            <span>48h Forecast</span>
          </div>

          <button
            onClick={onOpenRulesModal}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Risk & Load Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
}
