"""
Checkpoint Sampling Service.

Samples route polylines at fixed intervals (10, 25, 50 miles)
and computes estimated arrival times (ETA) at each checkpoint.
"""

from datetime import datetime, timedelta
import math
from typing import Dict, List, Tuple


METERS_PER_MILE = 1609.344


def haversine_distance_meters(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Computes distance in meters between two (lat, lon) coordinates using Haversine formula.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371000.0  # Earth radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c


def sample_route_checkpoints(
    coordinates: List[List[float]],
    total_distance_meters: float,
    total_duration_seconds: float,
    departure_time: datetime,
    sampling_interval_miles: float = 25.0,
) -> List[Dict]:
    """
    Samples checkpoints along a GeoJSON coordinates list [[lon, lat], ...]
    at approximately every `sampling_interval_miles`.

    Ensures:
      - Mile 0 (Origin) is included.
      - Regular intervals are sampled.
      - Final destination is included.
      - Arrival time (ETA) is computed for each checkpoint.
      - Segment distance in miles is assigned to each checkpoint.
    """
    if not coordinates or len(coordinates) < 2:
        return []

    # Convert coordinates to list of (lat, lon)
    # GeoJSON coords are [lon, lat]
    points = [(c[1], c[0]) for c in coordinates]

    # Precompute cumulative distances along the polyline
    cum_distances = [0.0]
    total_calculated_dist = 0.0
    for i in range(1, len(points)):
        d = haversine_distance_meters(points[i - 1], points[i])
        total_calculated_dist += d
        cum_distances.append(total_calculated_dist)

    effective_total_meters = total_distance_meters if total_distance_meters > 0 else max(total_calculated_dist, 1.0)
    total_miles = effective_total_meters / METERS_PER_MILE
    interval_meters = sampling_interval_miles * METERS_PER_MILE

    # Target distances for checkpoints (in meters)
    target_distances = [0.0]
    curr = interval_meters
    while curr < effective_total_meters - (interval_meters * 0.25):
        target_distances.append(curr)
        curr += interval_meters

    # Always ensure the final destination is included
    if target_distances[-1] < effective_total_meters:
        target_distances.append(effective_total_meters)

    checkpoints: List[Dict] = []
    seg_idx = 0
    prev_target_m = 0.0

    for idx, target_m in enumerate(target_distances):
        # Find which segment contains target_m
        while seg_idx < len(cum_distances) - 2 and cum_distances[seg_idx + 1] < target_m:
            seg_idx += 1

        d0 = cum_distances[seg_idx]
        d1 = cum_distances[seg_idx + 1]
        p0 = points[seg_idx]
        p1 = points[seg_idx + 1]

        seg_len = d1 - d0
        if seg_len > 0:
            fraction = (target_m - d0) / seg_len
            fraction = max(0.0, min(1.0, fraction))
            lat = p0[0] + fraction * (p1[0] - p0[0])
            lon = p0[1] + fraction * (p1[1] - p0[1])
        else:
            lat, lon = p0

        # Calculate arrival time
        progress_ratio = target_m / effective_total_meters
        progress_ratio = max(0.0, min(1.0, progress_ratio))
        eta_seconds = progress_ratio * total_duration_seconds
        arrival_time = departure_time + timedelta(seconds=eta_seconds)
        mile_marker = target_m / METERS_PER_MILE

        # Segment distance associated with this checkpoint
        segment_dist_miles = (target_m - prev_target_m) / METERS_PER_MILE
        if idx == 0:
            segment_dist_miles = 0.0

        checkpoints.append({
            "index": idx,
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "mile_marker": round(mile_marker, 1),
            "segment_distance_miles": round(segment_dist_miles, 1),
            "eta_timestamp": arrival_time.isoformat(),
            "eta_offset_hours": round(eta_seconds / 3600.0, 2),
            "is_origin": (idx == 0),
            "is_destination": (idx == len(target_distances) - 1),
        })
        prev_target_m = target_m

    return checkpoints
