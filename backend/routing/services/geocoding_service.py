"""
Geocoding Service for resolving city names and addresses to coordinates.
Uses Open-Meteo Geocoding API with fallback to built-in US transportation hubs.
"""

import logging
from typing import Dict, List, Optional
import requests
from .http_client import resilient_get

logger = logging.getLogger(__name__)

# Built-in transportation hubs and major freight cities for offline resilience & quick testing
PRESET_HUBS = [
    {"name": "Chicago, IL", "latitude": 41.8781, "longitude": -87.6298, "country": "United States", "admin1": "Illinois"},
    {"name": "Denver, CO", "latitude": 39.7392, "longitude": -104.9903, "country": "United States", "admin1": "Colorado"},
    {"name": "Dallas, TX", "latitude": 32.7767, "longitude": -96.7970, "country": "United States", "admin1": "Texas"},
    {"name": "Atlanta, GA", "latitude": 33.7490, "longitude": -84.3880, "country": "United States", "admin1": "Georgia"},
    {"name": "Seattle, WA", "latitude": 47.6062, "longitude": -122.3321, "country": "United States", "admin1": "Washington"},
    {"name": "Minneapolis, MN", "latitude": 44.9778, "longitude": -93.2650, "country": "United States", "admin1": "Minnesota"},
    {"name": "Los Angeles, CA", "latitude": 34.0522, "longitude": -118.2437, "country": "United States", "admin1": "California"},
    {"name": "New York, NY", "latitude": 40.7128, "longitude": -74.0060, "country": "United States", "admin1": "New York"},
    {"name": "Kansas City, MO", "latitude": 39.0997, "longitude": -94.5786, "country": "United States", "admin1": "Missouri"},
    {"name": "Salt Lake City, UT", "latitude": 40.7608, "longitude": -111.8910, "country": "United States", "admin1": "Utah"},
    {"name": "Cheyenne, WY", "latitude": 41.1400, "longitude": -104.8202, "country": "United States", "admin1": "Wyoming"},
    {"name": "Phoenix, AZ", "latitude": 33.4484, "longitude": -112.0740, "country": "United States", "admin1": "Arizona"},
]


def search_locations(query: str, limit: int = 5) -> List[Dict]:
    """
    Search for locations matching query.
    Returns list of dicts: {name, display_name, latitude, longitude, state, country}
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    results = []

    # Try Open-Meteo Geocoding API first (free, no auth key required)
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": clean_query,
            "count": limit,
            "language": "en",
            "format": "json",
        }
        resp = resilient_get(url, params=params, timeout=4.0)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("results", []):
                admin1 = item.get("admin1", "")
                country = item.get("country", "")
                name = item.get("name", "")
                
                parts = [p for p in [name, admin1, country] if p]
                display_name = ", ".join(parts)
                
                results.append({
                    "name": name,
                    "display_name": display_name,
                    "latitude": float(item["latitude"]),
                    "longitude": float(item["longitude"]),
                    "state": admin1,
                    "country": country,
                })
    except Exception as e:
        logger.warning(f"Live geocoding request failed: {e}. Falling back to preset matches.")

    # If results found, return them
    if results:
        return results

    # Fallback to local preset matches
    q_lower = clean_query.lower()
    for hub in PRESET_HUBS:
        if q_lower in hub["name"].lower() or q_lower in hub["admin1"].lower():
            results.append({
                "name": hub["name"].split(",")[0],
                "display_name": f"{hub['name']}, {hub['country']}",
                "latitude": hub["latitude"],
                "longitude": hub["longitude"],
                "state": hub["admin1"],
                "country": hub["country"],
            })
            if len(results) >= limit:
                break

    return results
