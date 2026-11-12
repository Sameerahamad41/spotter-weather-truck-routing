from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path("geocode/", views.geocode_location, name="geocode_location"),
    path("presets/", views.get_corridor_presets, name="corridor_presets"),
    path("routes/analyze/", views.analyze_routes_view, name="analyze_routes"),
]
