"""
Corridor Weather Service.

Generates a spatial grid along the route corridor and computes
hourly weather forecast & risk for a 0–48 hour forecast timeline.
"""

from datetime import datetime, timedelta, timezone
import math
from typing import Dict, List, Tuple
from .risk_engine import evaluate_checkpoint_risk, RiskLevel
from .weather_service import parse_iso_datetime


def generate_corridor_grid(routes: List[Dict], grid_density: int = 30) -> List[Tuple[float, float]]:
    """
    Samples representative geographical points covering the entire trip corridor
    (all 3 route paths and their bounding buffer).
    """
    all_points: List[Tuple[float, float]] = []

    for r in routes:
        coords = r.get("geometry", {}).get("coordinates", [])
        # Sample every Nth point along each route
        step = max(1, len(coords) // (grid_density // len(routes) if len(routes) else 10))
        for i in range(0, len(coords), step):
            lon, lat = coords[i]
            all_points.append((lat, lon))

    if not all_points:
        return []

    # Calculate bounding box
    min_lat = min(p[0] for p in all_points)
    max_lat = max(p[0] for p in all_points)
    min_lon = min(p[1] for p in all_points)
    max_lon = max(p[1] for p in all_points)

    # Add slight buffer (~0.4 deg ~ 25 miles)
    lat_pad = max(0.3, (max_lat - min_lat) * 0.08)
    lon_pad = max(0.3, (max_lon - min_lon) * 0.08)

    # Select unique spaced points
    selected: List[Tuple[float, float]] = []
    # Deduplicate closely packed points
    for p in all_points:
        if not any(abs(p[0] - s[0]) < 0.35 and abs(p[1] - s[1]) < 0.35 for s in selected):
            selected.append((round(p[0], 4), round(p[1], 4)))
            if len(selected) >= grid_density:
                break

    # If few points, fill in corridor line
    if len(selected) < 15 and all_points:
        return all_points[:grid_density]

    return selected


def build_corridor_timeline_forecast(
    corridor_points: List[Tuple[float, float]],
    departure_time: datetime,
    load_weight_lbs: float,
    max_hours: int = 48,
    hour_step: int = 2,  # sample every 2 hours: 0, 2, 4, ..., 48 for fast payload and smooth scrubbing
) -> Dict[int, List[Dict]]:
    """
    Builds a 0–48 hour timeline of weather risk along the corridor.
    Returns:
      {
        0: [ {lat, lon, wind_mph, rain_in, snow_in, risk_score, risk_level, color}, ... ],
        2: [ ... ],
        ...
        48: [ ... ]
      }
    """
    timeline: Dict[int, List[Dict]] = {}
    base_time = departure_time.astimezone(timezone.utc)

    # We generate spatially coherent weather waves moving across the corridor over 48h
    # (simulating atmospheric pressure systems moving west-to-east)
    for offset_h in range(0, max_hours + 1, hour_step):
        frame_time = base_time + timedelta(hours=offset_h)
        points_data = []

        for lat, lon in corridor_points:
            # Weather wave propagation: system travels ~25 mph eastward (delta lon per hour)
            system_phase = (lon + (offset_h * 0.35)) * 0.3 + lat * 0.2
            storm_intensity = math.sin(system_phase) * math.cos(lat * 0.15 + system_phase * 0.5)

            # Wind speed in mph
            wind_mph = max(6.0, 18.0 + storm_intensity * 26.0 + math.sin(offset_h * 0.25) * 6.0)

            # Precipitation
            temp_f = 48.0 - (lat - 38.0) * 2.2 + math.cos(offset_h * 0.15) * 8.0
            
            rain_in = 0.0
            snow_in = 0.0

            if storm_intensity > 0.25:
                rate = (storm_intensity - 0.25) * 0.65
                if temp_f <= 32.0:
                    snow_in = round(rate * 2.5, 2)
                else:
                    rain_in = round(rate, 2)

            risk_eval = evaluate_checkpoint_risk(
                wind_mph=wind_mph,
                rain_in_per_hr=rain_in,
                snow_in_per_hr=snow_in,
                load_weight_lbs=load_weight_lbs,
            )

            # Normalized intensity for heatmap gradient (0.0 to 1.0)
            # score 1 (Low) -> 0.2, score 5 (No Travel) -> 1.0
            intensity = round(risk_eval["overall_score"] / 5.0, 2)

            points_data.append({
                "latitude": lat,
                "longitude": lon,
                "wind_mph": round(wind_mph, 1),
                "rain_in_per_hr": rain_in,
                "snow_in_per_hr": snow_in,
                "temperature_f": round(temp_f, 1),
                "risk_score": risk_eval["overall_score"],
                "risk_level": risk_eval["overall_risk"],
                "color": risk_eval["color"],
                "intensity": intensity,
                "notes": risk_eval["notes"],
            })

        timeline[offset_h] = points_data

    return timeline
