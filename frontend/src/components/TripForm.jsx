import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Calendar, Clock, Weight, Route, Search, ChevronRight, Sparkles, Loader2 } from 'lucide-react';

export default function TripForm({
  onSubmit,
  isLoading,
  initialValues,
  presets = [],
}) {
  const [origin, setOrigin] = useState(initialValues?.origin || { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 });
  const [destination, setDestination] = useState(initialValues?.destination || { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 });
  
  // Format local ISO datetime for input
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [departureTime, setDepartureTime] = useState(initialValues?.departureTime || getDefaultDateTime());
  const [loadWeight, setLoadWeight] = useState(initialValues?.loadWeight || 38000);
  const [samplingInterval, setSamplingInterval] = useState(initialValues?.samplingInterval || 25);

  // Autocomplete states
  const [originQuery, setOriginQuery] = useState(origin.name || '');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);

  const [destQuery, setDestQuery] = useState(destination.name || '');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const originRef = useRef(null);
  const destRef = useRef(null);

  // Search geocode API
  const fetchSuggestions = async (query, setFunc) => {
    if (!query || query.length < 2) {
      setFunc([]);
      return;
    }
    try {
      const res = await fetch(`/api/geocode/?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setFunc(data);
      }
    } catch (e) {
      console.warn('Geocoding search failed:', e);
    }
  };

  // Debounced search for origin
  useEffect(() => {
    const timer = setTimeout(() => {
      if (originQuery && originQuery !== origin.name) {
        fetchSuggestions(originQuery, setOriginSuggestions);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originQuery]);

  // Debounced search for destination
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destQuery && destQuery !== destination.name) {
        fetchSuggestions(destQuery, setDestSuggestions);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (originRef.current && !originRef.current.contains(e.target)) {
        setShowOriginSuggestions(false);
      }
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyPreset = (preset) => {
    setOrigin(preset.origin);
    setOriginQuery(preset.origin.name);
    setDestination(preset.destination);
    setDestQuery(preset.destination.name);
    if (preset.default_load_weight_lbs) {
      setLoadWeight(preset.default_load_weight_lbs);
    }
    if (preset.default_sampling_interval_miles) {
      setSamplingInterval(preset.default_sampling_interval_miles);
    }
  };

  const setDepartureOffsetHours = (hours) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDepartureTime(d.toISOString().slice(0, 16));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert local datetime input to UTC ISO string
    const localDate = new Date(departureTime);
    const utcIso = localDate.toISOString();

    onSubmit({
      origin,
      destination,
      departure_time: utcIso,
      load_weight_lbs: Number(loadWeight),
      sampling_interval_miles: Number(samplingInterval),
    });
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Corridor Presets Bar */}
      {presets && presets.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Quick Test Corridors:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 cursor-pointer"
                title={p.description}
              >
                <span>{p.name.split('(')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin & Destination Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin */}
          <div className="relative" ref={originRef}>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Origin City / Freight Terminal
            </label>
            <div className="relative">
              <input
                type="text"
                value={originQuery}
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setShowOriginSuggestions(true);
                }}
                onFocus={() => setShowOriginSuggestions(true)}
                placeholder="Search city e.g. Chicago, IL"
                className="w-full bg-[#162032] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                required
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>

            {/* Suggestions dropdown */}
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1A253C] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {originSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOrigin(item);
                      setOriginQuery(item.display_name || item.name);
                      setShowOriginSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 border-b border-slate-800 last:border-0 transition"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="relative" ref={destRef}>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              Destination Terminal
            </label>
            <div className="relative">
              <input
                type="text"
                value={destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="Search city e.g. Denver, CO"
                className="w-full bg-[#162032] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                required
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>

            {/* Suggestions dropdown */}
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1A253C] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {destSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDestination(item);
                      setDestQuery(item.display_name || item.name);
                      setShowDestSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 border-b border-slate-800 last:border-0 transition"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departure Time, Load Weight, Sampling Interval */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Departure Date/Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Departure Date & Time
              </span>
            </label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full bg-[#162032] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              required
            />
            {/* Quick time offset buttons */}
            <div className="flex gap-1.5 mt-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setDepartureOffsetHours(0)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setDepartureOffsetHours(6)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                +6h
              </button>
              <button
                type="button"
                onClick={() => setDepartureOffsetHours(12)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                +12h
              </button>
              <button
                type="button"
                onClick={() => setDepartureOffsetHours(24)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                +24h
              </button>
            </div>
          </div>

          {/* Load Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Weight className="w-3.5 h-3.5 text-amber-400" />
                Load Weight (lbs)
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {Number(loadWeight).toLocaleString()} lb
              </span>
            </label>
            <input
              type="number"
              min="5000"
              max="80000"
              step="500"
              value={loadWeight}
              onChange={(e) => setLoadWeight(e.target.value)}
              className="w-full bg-[#162032] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              required
            />
            {/* Preset Weight Buttons */}
            <div className="flex gap-1.5 mt-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setLoadWeight(15000)}
                className={`px-2 py-0.5 rounded transition ${loadWeight === 15000 ? 'bg-cyan-700 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Empty (15k)
              </button>
              <button
                type="button"
                onClick={() => setLoadWeight(32000)}
                className={`px-2 py-0.5 rounded transition ${loadWeight === 32000 ? 'bg-cyan-700 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Triggers >30,000 lb rollover penalty at 45-54 mph winds"
              >
                Mid (&gt;30k)
              </button>
              <button
                type="button"
                onClick={() => setLoadWeight(42000)}
                className={`px-2 py-0.5 rounded transition ${loadWeight === 42000 ? 'bg-cyan-700 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Triggers >40,000 lb heavy penalty at 35-44 mph winds"
              >
                Heavy (&gt;40k)
              </button>
            </div>
          </div>

          {/* Sampling Interval (10 / 25 / 50 miles) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-cyan-400" />
              Checkpoint Sampling Interval
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setSamplingInterval(interval)}
                  className={`py-2 text-xs rounded-xl border font-semibold transition ${
                    samplingInterval === interval
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                      : 'bg-[#162032] border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {interval} mi
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 text-center">
              Weather sampled every {samplingInterval} miles at truck's calculated ETA
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing 3 Routes & Sampling Weather ETAs...</span>
              </>
            ) : (
              <>
                <span>Analyze 3 Route Options</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
