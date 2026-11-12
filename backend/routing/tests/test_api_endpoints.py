import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "spotter_routing.settings")
django.setup()

from rest_framework.test import APITestCase
from django.urls import reverse


class TestRoutingAPI(APITestCase):
    def test_health_check(self):
        url = reverse("health_check")
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["status"] == "healthy"

    def test_presets(self):
        url = reverse("corridor_presets")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) >= 3

    def test_geocode(self):
        url = reverse("geocode_location") + "?q=Denver"
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) > 0

    def test_analyze_routes_valid(self):
        url = reverse("analyze_routes")
        payload = {
            "origin": {"name": "Chicago, IL", "latitude": 41.8781, "longitude": -87.6298},
            "destination": {"name": "Denver, CO", "latitude": 39.7392, "longitude": -104.9903},
            "departure_time": "2026-11-12T12:00:00Z",
            "load_weight_lbs": 36000,
            "sampling_interval_miles": 50,
        }
        response = self.client.post(url, payload, format="json")
        assert response.status_code == 200
        data = response.data
        assert "routes" in data
        assert len(data["routes"]) == 3
        assert "corridor_timeline" in data
        assert data["recommended_route_id"] is not None
        assert data["routes"][0]["is_recommended"] is True

    def test_analyze_routes_missing_params(self):
        url = reverse("analyze_routes")
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 400
