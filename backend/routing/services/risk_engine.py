"""
Risk Engine for Weather-Aware Truck Routing.

Implements threshold classifications for Wind, Rain, and Snow,
along with load-weight modifiers and lexicographical route recommendation.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


class RiskLevel:
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    SEVERE = "Severe"
    NO_TRAVEL = "No Travel"

    ORDER = [LOW, MODERATE, HIGH, SEVERE, NO_TRAVEL]
    SCORES = {
        LOW: 1,
        MODERATE: 2,
        HIGH: 3,
        SEVERE: 4,
        NO_TRAVEL: 5,
    }
    COLORS = {
        LOW: "#10B981",       # Emerald green
        MODERATE: "#F59E0B",  # Amber/yellow
        HIGH: "#F97316",      # Orange
        SEVERE: "#EF4444",    # Red
        NO_TRAVEL: "#7F1D1D", # Dark crimson / maroon
    }


def classify_wind(wind_mph: float, load_weight_lbs: float) -> Tuple[str, List[str]]:
    """
    Classify wind risk including load-weight modifiers:
    Base rules:
      <25 mph: Low
      25–34 mph: Moderate
      35–44 mph: High
      45–54 mph: Severe
      >=55 mph: No Travel

    Load rules:
      >=55 mph -> No Travel for any load
      45–54 mph + >30,000 lb -> No Travel (escalated from Severe)
      35–44 mph + >40,000 lb -> Severe (escalated from High)
    """
    notes: List[str] = []
    
    if wind_mph >= 55.0:
        notes.append("Wind >= 55 mph: Absolute No Travel threshold reached for all vehicles.")
        return RiskLevel.NO_TRAVEL, notes
    
    if 45.0 <= wind_mph < 55.0:
        if load_weight_lbs > 30000.0:
            notes.append(
                f"Wind {wind_mph:.1f} mph + Load {load_weight_lbs:,.0f} lb (>30,000 lb): "
                "Escalated from Severe to NO TRAVEL due to high rollover/jackknife hazard."
            )
            return RiskLevel.NO_TRAVEL, notes
        notes.append(f"Wind {wind_mph:.1f} mph: Severe crosswind risk.")
        return RiskLevel.SEVERE, notes
        
    if 35.0 <= wind_mph < 45.0:
        if load_weight_lbs > 40000.0:
            notes.append(
                f"Wind {wind_mph:.1f} mph + Heavy Load {load_weight_lbs:,.0f} lb (>40,000 lb): "
                "Escalated from High to SEVERE due to critical momentum and lateral instability."
            )
            return RiskLevel.SEVERE, notes
        notes.append(f"Wind {wind_mph:.1f} mph: High wind warning.")
        return RiskLevel.HIGH, notes
        
    if 25.0 <= wind_mph < 35.0:
        return RiskLevel.MODERATE, notes
        
    return RiskLevel.LOW, notes


def classify_rain(rain_in_per_hr: float) -> Tuple[str, List[str]]:
    """
    Classify rain risk:
      <0.10 in/hr: Low
      0.10–0.25 in/hr: Moderate
      0.25–0.50 in/hr: High
      0.50–1.00 in/hr: Severe
      >1.00 in/hr: No Travel
    """
    notes: List[str] = []
    if rain_in_per_hr > 1.00:
        notes.append(f"Extreme Rain {rain_in_per_hr:.2f} in/hr (>1.00 in/hr): Hydroplaning and flash flood risk (NO TRAVEL).")
        return RiskLevel.NO_TRAVEL, notes
    if rain_in_per_hr >= 0.50:
        notes.append(f"Heavy Rain {rain_in_per_hr:.2f} in/hr (0.50-1.00 in/hr): Severe visibility and hydroplane risk.")
        return RiskLevel.SEVERE, notes
    if rain_in_per_hr >= 0.25:
        return RiskLevel.HIGH, notes
    if rain_in_per_hr >= 0.10:
        return RiskLevel.MODERATE, notes
    return RiskLevel.LOW, notes


def classify_snow(snow_in_per_hr: float) -> Tuple[str, List[str]]:
    """
    Classify snow risk:
      <0.5 in/hr: Low
      0.5–1.0 in/hr: Moderate
      1.0–2.0 in/hr: High
      2.0–3.0 in/hr: Severe
      >3.0 in/hr: No Travel
    """
    notes: List[str] = []
    if snow_in_per_hr > 3.0:
        notes.append(f"Blizzard conditions {snow_in_per_hr:.2f} in/hr (>3.0 in/hr): Whiteout and impassable roads (NO TRAVEL).")
        return RiskLevel.NO_TRAVEL, notes
    if snow_in_per_hr >= 2.0:
        notes.append(f"Heavy Snow {snow_in_per_hr:.2f} in/hr (2.0-3.0 in/hr): Severe traction and visibility impairment.")
        return RiskLevel.SEVERE, notes
    if snow_in_per_hr >= 1.0:
        return RiskLevel.HIGH, notes
    if snow_in_per_hr >= 0.5:
        return RiskLevel.MODERATE, notes
    return RiskLevel.LOW, notes


def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_per_hr: float,
    snow_in_per_hr: float,
    load_weight_lbs: float,
) -> Dict:
    """
    Evaluate comprehensive weather risk for a checkpoint under given load.
    The overall risk is the maximum risk level across wind (load-adjusted), rain, and snow.
    """
    wind_risk, wind_notes = classify_wind(wind_mph, load_weight_lbs)
    rain_risk, rain_notes = classify_rain(rain_in_per_hr)
    snow_risk, snow_notes = classify_snow(snow_in_per_hr)
    
    sub_risks = [wind_risk, rain_risk, snow_risk]
    overall_score = max(RiskLevel.SCORES[r] for r in sub_risks)
    
    # Map score back to level
    overall_level = RiskLevel.LOW
    for level, score in RiskLevel.SCORES.items():
        if score == overall_score:
            overall_level = level
            break
            
    all_notes = wind_notes + rain_notes + snow_notes

    return {
        "overall_risk": overall_level,
        "overall_score": overall_score,
        "color": RiskLevel.COLORS[overall_level],
        "wind": {
            "value": round(wind_mph, 1),
            "unit": "mph",
            "risk": wind_risk,
            "notes": wind_notes,
        },
        "rain": {
            "value": round(rain_in_per_hr, 2),
            "unit": "in/hr",
            "risk": rain_risk,
            "notes": rain_notes,
        },
        "snow": {
            "value": round(snow_in_per_hr, 2),
            "unit": "in/hr",
            "risk": snow_risk,
            "notes": snow_notes,
        },
        "load_weight_lbs": load_weight_lbs,
        "notes": all_notes,
    }


def aggregate_route_metrics(checkpoints: List[Dict], total_distance_miles: float, total_duration_seconds: float) -> Dict:
    """
    Aggregates risk miles and computes average risk for a route based on checkpoints.
    Each checkpoint represents a segment distance.
    """
    if not checkpoints:
        return {
            "severe_miles": 0.0,
            "high_miles": 0.0,
            "moderate_miles": 0.0,
            "low_miles": 0.0,
            "no_travel_miles": 0.0,
            "average_risk_score": 1.0,
            "average_risk_level": RiskLevel.LOW,
            "total_distance_miles": total_distance_miles,
            "total_duration_seconds": total_duration_seconds,
        }

    # Sum miles per risk level
    breakdown = {
        RiskLevel.LOW: 0.0,
        RiskLevel.MODERATE: 0.0,
        RiskLevel.HIGH: 0.0,
        RiskLevel.SEVERE: 0.0,
        RiskLevel.NO_TRAVEL: 0.0,
    }
    
    weighted_score_sum = 0.0
    accumulated_segment_miles = 0.0

    for cp in checkpoints:
        seg_miles = cp.get("segment_distance_miles", 0.0)
        risk = cp.get("risk", {}).get("overall_risk", RiskLevel.LOW)
        score = RiskLevel.SCORES.get(risk, 1)
        
        breakdown[risk] = breakdown.get(risk, 0.0) + seg_miles
        weighted_score_sum += score * seg_miles
        accumulated_segment_miles += seg_miles

    effective_miles = accumulated_segment_miles if accumulated_segment_miles > 0 else total_distance_miles
    avg_score = (weighted_score_sum / effective_miles) if effective_miles > 0 else 1.0
    avg_score = round(avg_score, 2)

    # Determine average risk level label
    if avg_score >= 4.5:
        avg_level = RiskLevel.NO_TRAVEL
    elif avg_score >= 3.5:
        avg_level = RiskLevel.SEVERE
    elif avg_score >= 2.5:
        avg_level = RiskLevel.HIGH
    elif avg_score >= 1.5:
        avg_level = RiskLevel.MODERATE
    else:
        avg_level = RiskLevel.LOW

    return {
        "severe_miles": round(breakdown[RiskLevel.SEVERE], 1),
        "high_miles": round(breakdown[RiskLevel.HIGH], 1),
        "moderate_miles": round(breakdown[RiskLevel.MODERATE], 1),
        "low_miles": round(breakdown[RiskLevel.LOW], 1),
        "no_travel_miles": round(breakdown[RiskLevel.NO_TRAVEL], 1),
        "average_risk_score": avg_score,
        "average_risk_level": avg_level,
        "total_distance_miles": round(total_distance_miles, 1),
        "total_duration_seconds": total_duration_seconds,
    }


def rank_routes(routes: List[Dict]) -> List[Dict]:
    """
    Ranks routes according to the specification:
    Prefer:
      1. Fewest Severe miles (and Fewest No Travel miles prioritized lowest)
      2. Fewest High miles
      3. Lowest average risk
      4. Shortest travel times

    Returns the routes annotated with 'rank' (1-indexed), 'is_recommended' (True for rank 1),
    and a human-readable 'recommendation_reason'.
    """
    if not routes:
        return []

    # Lexicographical sort key:
    # (no_travel_miles, severe_miles, high_miles, average_risk_score, travel_time_seconds)
    def sort_key(r):
        m = r.get("metrics", {})
        return (
            m.get("no_travel_miles", 0.0),
            m.get("severe_miles", 0.0),
            m.get("high_miles", 0.0),
            m.get("average_risk_score", 1.0),
            m.get("total_duration_seconds", 0.0),
        )

    sorted_routes = sorted(routes, key=sort_key)

    for idx, r in enumerate(sorted_routes):
        r["rank"] = idx + 1
        r["is_recommended"] = (idx == 0)
        
        m = r.get("metrics", {})
        no_travel = m.get("no_travel_miles", 0.0)
        severe = m.get("severe_miles", 0.0)
        high = m.get("high_miles", 0.0)
        avg_score = m.get("average_risk_score", 1.0)
        hours = round(m.get("total_duration_seconds", 0.0) / 3600.0, 1)

        if idx == 0:
            if no_travel > 0:
                r["recommendation_reason"] = (
                    f"Recommended as safest available option, but contains {no_travel} miles of NO TRAVEL conditions. "
                    "Delaying departure is strongly advised."
                )
            else:
                reasons = []
                if severe == 0.0:
                    reasons.append("Zero severe weather miles")
                else:
                    reasons.append(f"Lowest severe weather exposure ({severe} mi)")
                if high == 0.0:
                    reasons.append("zero high-risk miles")
                else:
                    reasons.append(f"{high} high-risk mi")
                reasons.append(f"avg risk score of {avg_score}/5.0")
                reasons.append(f"est. travel time {hours} hrs")
                r["recommendation_reason"] = (
                    "Optimal route based on Spotter safety criteria: " + ", ".join(reasons) + "."
                )
        else:
            first_m = sorted_routes[0].get("metrics", {})
            diffs = []
            if no_travel > first_m.get("no_travel_miles", 0.0):
                diffs.append(f"+{no_travel - first_m.get('no_travel_miles', 0.0):.1f} mi NO TRAVEL")
            if severe > first_m.get("severe_miles", 0.0):
                diffs.append(f"+{severe - first_m.get('severe_miles', 0.0):.1f} mi Severe weather")
            if high > first_m.get("high_miles", 0.0):
                diffs.append(f"+{high - first_m.get('high_miles', 0.0):.1f} mi High risk")
            if avg_score > first_m.get("average_risk_score", 1.0):
                diffs.append(f"+{avg_score - first_m.get('average_risk_score', 1.0):.2f} higher risk score")
            diff_str = ", ".join(diffs) if diffs else "Higher overall risk or travel duration"
            r["recommendation_reason"] = f"Alternative option #{idx + 1} ({diff_str})."

    return sorted_routes
