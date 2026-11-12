from datetime import datetime, timezone
import pytest
from routing.services.checkpoint_sampler import sample_route_checkpoints, METERS_PER_MILE
from routing.services.osrm_service import analyze_weather_routes, fetch_three_routes


class TestCheckpointSampling:
    def test_sample_intervals(self):
        # Straight line of 100 miles (160,934 meters)
        # Lat approx 1.45 degrees
        coords = [
            [-87.6298, 41.8781],  # Chicago
            [-87.6298, 43.3281],  # ~100 miles North
        ]
        total_dist_m = 100.0 * METERS_PER_MILE
        total_dur_s = 2.0 * 3600  # 2 hours
        dep_time = datetime(2026, 11, 12, 10, 0, tzinfo=timezone.utc)

        # Sample at 25 miles
        checkpoints = sample_route_checkpoints(
            coordinates=coords,
            total_distance_meters=total_dist_m,
            total_duration_seconds=total_dur_s,
            departure_time=dep_time,
            sampling_interval_miles=25.0,
        )

        assert len(checkpoints) >= 4
        # First point should be origin at 0.0 miles
        assert checkpoints[0]["mile_marker"] == 0.0
        assert checkpoints[0]["is_origin"] is True
        assert checkpoints[0]["eta_offset_hours"] == 0.0

        # Last point should be destination at 100.0 miles
        assert checkpoints[-1]["mile_marker"] == 100.0
        assert checkpoints[-1]["is_destination"] is True
        assert checkpoints[-1]["eta_offset_hours"] == 2.0


class TestRoutingOrchestration:
    def test_three_routes_generated(self):
        origin = (41.8781, -87.6298)  # Chicago
        dest = (39.7392, -104.9903)   # Denver
        routes = fetch_three_routes(origin, dest)
        assert len(routes) == 3
        for r in routes:
            assert "geometry" in r
            assert len(r["geometry"]["coordinates"]) > 2
            assert r["total_distance_miles"] > 500

    def test_full_analysis(self):
        origin = (41.8781, -87.6298)  # Chicago
        dest = (39.7392, -104.9903)   # Denver
        result = analyze_weather_routes(
            origin=origin,
            dest=dest,
            departure_time_str="2026-11-12T10:00:00Z",
            load_weight_lbs=35000,
            sampling_interval_miles=50.0,
        )

        assert len(result["routes"]) == 3
        assert result["recommended_route_id"] is not None
        assert "corridor_timeline" in result
        
        # Check first route has checkpoints with risk evaluation
        route_1 = result["routes"][0]
        assert len(route_1["checkpoints"]) > 0
        cp = route_1["checkpoints"][0]
        assert "risk" in cp
        assert "weather" in cp
        assert "overall_risk" in cp["risk"]
