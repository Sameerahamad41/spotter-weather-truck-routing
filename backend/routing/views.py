"""
Views for the Weather-Aware Truck Routing API.
"""

from datetime import datetime, timezone
import logging
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services.osrm_service import analyze_weather_routes
from .services.geocoding_service import search_locations, PRESET_HUBS

logger = logging.getLogger(__name__)


@api_view(["GET"])
def health_check(request):
    """Health check endpoint."""
    return Response({
        "status": "healthy",
        "service": "Spotter Weather-Aware Truck Routing API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@api_view(["GET"])
def geocode_location(request):
    """
    Search locations/cities by query string.
    GET /api/geocode/?q=Chicago
    """
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response([])

    limit = int(request.query_params.get("limit", 5))
    results = search_locations(query, limit=limit)
    return Response(results)


@api_view(["GET"])
def get_corridor_presets(request):
    """
    Returns popular freight corridor presets for 1-click evaluation.
    """
    presets = [
        {
            "id": "chicago-denver",
            "name": "Midwest to Rockies (I-80 / I-76)",
            "description": "High plains crosswinds and mountain snow transitions.",
            "origin": {"name": "Chicago, IL", "latitude": 41.8781, "longitude": -87.6298},
            "destination": {"name": "Denver, CO", "latitude": 39.7392, "longitude": -104.9903},
            "default_load_weight_lbs": 38000,
            "default_sampling_interval_miles": 25,
        },
        {
            "id": "seattle-minneapolis",
            "name": "Northern Pacific to Upper Midwest (I-90 / I-94)",
            "description": "Sub-zero temperatures, mountain passes, and winter storm systems.",
            "origin": {"name": "Seattle, WA", "latitude": 47.6062, "longitude": -122.3321},
            "destination": {"name": "Minneapolis, MN", "latitude": 44.9778, "longitude": -93.2650},
            "default_load_weight_lbs": 42000,
            "default_sampling_interval_miles": 50,
        },
        {
            "id": "dallas-atlanta",
            "name": "Southern Sunbelt Corridor (I-20)",
            "description": "Severe rain, convective thunderstorms, and high-speed freight lanes.",
            "origin": {"name": "Dallas, TX", "latitude": 32.7767, "longitude": -96.7970},
            "destination": {"name": "Atlanta, GA", "latitude": 33.7490, "longitude": -84.3880},
            "default_load_weight_lbs": 28000,
            "default_sampling_interval_miles": 25,
        },
        {
            "id": "saltlake-cheyenne",
            "name": "Wyoming Wind Corridor (I-80 Summit)",
            "description": "Notorious high-wind rollover corridor for commercial tractor-trailers.",
            "origin": {"name": "Salt Lake City, UT", "latitude": 40.7608, "longitude": -111.8910},
            "destination": {"name": "Cheyenne, WY", "latitude": 41.1400, "longitude": -104.8202},
            "default_load_weight_lbs": 34000,
            "default_sampling_interval_miles": 10,
        },
    ]
    return Response(presets)


@api_view(["POST"])
def analyze_routes_view(request):
    """
    Main Route Analysis Endpoint.
    POST /api/routes/analyze/
    """
    data = request.data or {}

    origin_raw = data.get("origin")
    dest_raw = data.get("destination")

    if not origin_raw or not dest_raw:
        return Response(
            {"error": "Both 'origin' and 'destination' with latitude and longitude are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        origin_lat = float(origin_raw.get("latitude"))
        origin_lon = float(origin_raw.get("longitude"))
        dest_lat = float(dest_raw.get("latitude"))
        dest_lon = float(dest_raw.get("longitude"))
    except (TypeError, ValueError):
        return Response(
            {"error": "Latitude and longitude must be valid floating point numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    load_weight_lbs = float(data.get("load_weight_lbs", 30000.0))
    sampling_interval = float(data.get("sampling_interval_miles", 25.0))
    if sampling_interval not in [10.0, 25.0, 50.0]:
        sampling_interval = 25.0

    departure_time_str = data.get("departure_time")
    if not departure_time_str:
        departure_time_str = datetime.now(timezone.utc).isoformat()

    try:
        analysis_result = analyze_weather_routes(
            origin=(origin_lat, origin_lon),
            dest=(dest_lat, dest_lon),
            departure_time_str=departure_time_str,
            load_weight_lbs=load_weight_lbs,
            sampling_interval_miles=sampling_interval,
        )
        
        analysis_result["origin_name"] = origin_raw.get("name", "Origin")
        analysis_result["destination_name"] = dest_raw.get("name", "Destination")

        return Response(analysis_result)
    except Exception as e:
        logger.exception("Failed to analyze routes")
        return Response(
            {"error": f"Internal routing analysis failure: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
