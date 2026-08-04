import os
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

def load_json_file(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_segments():
    return load_json_file('segments.json')

def get_support_matrix():
    return load_json_file('supportMatrix.json')

def get_recommendation_categories():
    return load_json_file('recommendationCategories.json')

def get_projects():
    return [
        {"id": "nh44", "name": "NH-44 Tunnel T-3 — Pkg 7"},
        {"id": "himank", "name": "Himank Hydro Headrace Tunnel"},
        {"id": "metro6", "name": "Metro Line 6 — Reach C"}
    ]

def get_layers():
    return [
        {"id": "geology", "name": "Geology", "category": "layer", "color": "#C98B4A", "default": True},
        {"id": "hydrology", "name": "Hydrology", "category": "layer", "color": "#4F8FA6", "default": True},
        {"id": "faults", "name": "Faults & Shear", "category": "layer", "color": "#D6543F", "default": False},
        {"id": "boreholes", "name": "Boreholes", "category": "layer", "color": "#D9B23C", "default": False},
        {"id": "terrain", "name": "DEM / Terrain", "category": "layer", "color": "#7C8B6E", "default": False},
        {"id": "pointcloud", "name": "Point Cloud", "category": "layer", "color": "#9B8AC4", "default": False},
        {"id": "hazard", "name": "Hazard Heat", "category": "overlay", "color": "#E0913F", "default": True},
        {"id": "confidence", "name": "Confidence Map", "category": "overlay", "color": "#4FA6A0", "default": False},
        {"id": "rmrtrack", "name": "RMR Track", "category": "lsection", "color": "#5FA864", "default": False},
        {"id": "supporttrack", "name": "Support Track", "category": "lsection", "color": "#D9B23C", "default": False}
    ]

def get_system_status():
    return {
        "status": "LIVE",
        "lastSyncMinutesAgo": 2,
        "faceMethod": "NATM — Drill & Blast",
        "excavatedMeters": 4260,
        "totalMeters": 9800
    }
