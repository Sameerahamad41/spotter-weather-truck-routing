import pytest
from routing.services.risk_engine import (
    RiskLevel,
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_risk,
    aggregate_route_metrics,
    rank_routes,
)


class TestWindClassification:
    def test_low_wind(self):
        risk, notes = classify_wind(20.0, load_weight_lbs=25000)
        assert risk == RiskLevel.LOW
        assert len(notes) == 0

    def test_moderate_wind(self):
        risk, notes = classify_wind(28.0, load_weight_lbs=25000)
        assert risk == RiskLevel.MODERATE

    def test_high_wind_normal_load(self):
        # 35-44 with <= 40,000 lbs -> High
        risk, notes = classify_wind(38.0, load_weight_lbs=35000)
        assert risk == RiskLevel.HIGH

    def test_high_wind_heavy_load_escalation_to_severe(self):
        # 35-44 mph + >40,000 lb -> Severe
        risk, notes = classify_wind(38.0, load_weight_lbs=42000)
        assert risk == RiskLevel.SEVERE
        assert any("Escalated from High to SEVERE" in n for n in notes)

    def test_severe_wind_normal_load(self):
        # 45-54 mph with <= 30,000 lbs -> Severe
        risk, notes = classify_wind(48.0, load_weight_lbs=28000)
        assert risk == RiskLevel.SEVERE

    def test_severe_wind_heavy_load_escalation_to_no_travel(self):
        # 45-54 mph + >30,000 lb -> No Travel
        risk, notes = classify_wind(48.0, load_weight_lbs=32000)
        assert risk == RiskLevel.NO_TRAVEL
        assert any("NO TRAVEL" in n for n in notes)

    def test_no_travel_wind_any_load(self):
        # >= 55 mph -> No Travel for any load
        risk1, _ = classify_wind(55.0, load_weight_lbs=10000)
        risk2, _ = classify_wind(65.0, load_weight_lbs=45000)
        assert risk1 == RiskLevel.NO_TRAVEL
        assert risk2 == RiskLevel.NO_TRAVEL


class TestRainClassification:
    def test_rain_thresholds(self):
        assert classify_rain(0.05)[0] == RiskLevel.LOW
        assert classify_rain(0.15)[0] == RiskLevel.MODERATE
        assert classify_rain(0.35)[0] == RiskLevel.HIGH
        assert classify_rain(0.75)[0] == RiskLevel.SEVERE
        assert classify_rain(1.20)[0] == RiskLevel.NO_TRAVEL


class TestSnowClassification:
    def test_snow_thresholds(self):
        assert classify_snow(0.2)[0] == RiskLevel.LOW
        assert classify_snow(0.7)[0] == RiskLevel.MODERATE
        assert classify_snow(1.5)[0] == RiskLevel.HIGH
        assert classify_snow(2.5)[0] == RiskLevel.SEVERE
        assert classify_snow(3.5)[0] == RiskLevel.NO_TRAVEL


class TestCheckpointEvaluation:
    def test_max_hazard_selection(self):
        # Low wind, Severe rain, Low snow -> Severe
        eval_res = evaluate_checkpoint_risk(
            wind_mph=15.0,
            rain_in_per_hr=0.6,
            snow_in_per_hr=0.1,
            load_weight_lbs=20000,
        )
        assert eval_res["overall_risk"] == RiskLevel.SEVERE
        assert eval_res["overall_score"] == 4

    def test_load_rule_impact_on_checkpoint(self):
        # Wind 38 mph + load 45,000 lbs escalates to Severe
        eval_res = evaluate_checkpoint_risk(
            wind_mph=38.0,
            rain_in_per_hr=0.0,
            snow_in_per_hr=0.0,
            load_weight_lbs=45000,
        )
        assert eval_res["overall_risk"] == RiskLevel.SEVERE


class TestRouteRecommendationHierarchy:
    def test_ranking_preference(self):
        # Route A: 0 Severe, 10 High, avg 2.2, 10 hours
        # Route B: 5 Severe, 0 High, avg 2.0, 8 hours
        # Route C: 0 Severe, 20 High, avg 2.5, 9 hours
        # Priority 1: Fewest Severe miles -> Route A & C (0 severe) beat Route B (5 severe)
        # Priority 2: Fewest High miles -> Route A (10) beats Route C (20)
        # Therefore order must be: Route A, Route C, Route B
        routes = [
            {
                "id": "B",
                "metrics": {
                    "no_travel_miles": 0.0,
                    "severe_miles": 5.0,
                    "high_miles": 0.0,
                    "average_risk_score": 2.0,
                    "total_duration_seconds": 8 * 3600,
                },
            },
            {
                "id": "C",
                "metrics": {
                    "no_travel_miles": 0.0,
                    "severe_miles": 0.0,
                    "high_miles": 20.0,
                    "average_risk_score": 2.5,
                    "total_duration_seconds": 9 * 3600,
                },
            },
            {
                "id": "A",
                "metrics": {
                    "no_travel_miles": 0.0,
                    "severe_miles": 0.0,
                    "high_miles": 10.0,
                    "average_risk_score": 2.2,
                    "total_duration_seconds": 10 * 3600,
                },
            },
        ]
        ranked = rank_routes(routes)
        assert ranked[0]["id"] == "A"
        assert ranked[0]["is_recommended"] is True
        assert ranked[1]["id"] == "C"
        assert ranked[2]["id"] == "B"
