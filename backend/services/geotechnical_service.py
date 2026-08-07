import os
import json
import math

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

def load_json_file(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

import csv
import random

# 1. Configurable Aggregation Settings
AGGREGATION_CONFIG = {
    "clustering": {
        "weights": {
            "rmr": 0.2,
            "gsi": 0.2,
            "q_system": 0.1,
            "lithology": 0.5,
            "support_class": 0.4,
            "groundwater": 0.3,
            "fault_presence": 0.5
        },
        "max_distance": 600.0,
        "split_threshold": 13.0
    },
    "hazard_scoring": {
        "weights": {
            "fault_presence": 3.0,
            "groundwater": 2.5,
            "rmr": 2.0,
            "water_inflow": 1.8,
            "gsi": 1.5,
            "q_system": 1.5,
            "support_class": 1.0
        },
        "thresholds": {
            "high": 6.5,
            "moderate": 3.0
        }
    }
}

# 2. Geotechnical normalization helpers
def normalize_lithology(lith):
    if not lith:
        return 'Unclassified'
    l = lith.lower()
    if 'sand' in l or 'quartzite' in l or 'gneiss' in l or 'dolerite' in l:
        if 'silt' in l or 'clay' in l:
            return 'Mixed Ground'
        return 'Sandstone'
    if 'silt' in l:
        if 'clay' in l or 'shale' in l:
            return 'Mixed Ground'
        return 'Siltstone'
    if 'clay' in l or 'shale' in l or 'phyllite' in l:
        return 'Claystone'
    return 'Unclassified'

def normalize_groundwater(gw):
    if not gw:
        return 'Dry'
    g = gw.lower()
    if 'wet' in g or 'flowing' in g or 'dripping' in g:
        return 'Wet'
    if 'damp' in g or 'ooz' in g:
        return 'Damp'
    return 'Dry'

def normalize_fault(fault):
    if not fault:
        return 0
    f = str(fault).lower()
    if 'yes' in f or f == '1' or f == 'true':
        return 1
    return 0

def get_hazard_zones():
    # Load raw observations to find fault locations
    joint_path = os.path.join(DATA_DIR, 'Tunnel_Joint_Dataset_Cleaned.csv')
    if not os.path.exists(joint_path):
        return {"zones": [], "faults": []}
        
    raw_faults = []
    try:
        with open(joint_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for r in reader:
                ch_str = r.get('Chainage')
                in_fault = r.get('In_Fault_Zone', '').lower()
                is_fault = 'yes' in in_fault or in_fault == '1' or in_fault == 'true'
                if ch_str and is_fault:
                    try:
                        raw_faults.append(round(float(ch_str), 1))
                    except ValueError:
                        pass
    except Exception as e:
        print("Error reading faults for hazard zones:", e)
        return {"zones": [], "faults": []}
        
    if not raw_faults:
        return {"zones": [{"start": 0.0, "end": 10461.0, "hazard": "low"}], "faults": []}
        
    raw_faults.sort()
    
    # 1. Group contiguous fault observations (spacing limit 25m)
    fault_runs = []
    current_run = None
    for ch in raw_faults:
        if current_run is None:
            current_run = [ch, ch]
        else:
            if ch - current_run[1] <= 25.0:
                current_run[1] = ch
            else:
                fault_runs.append((current_run[0], current_run[1]))
                current_run = [ch, ch]
    if current_run is not None:
        fault_runs.append((current_run[0], current_run[1]))
        
    # 2. Build RED and YELLOW buffer intervals
    tunnel_max = 10461.0
    red_intervals = []
    yellow_intervals = []
    
    for f_start, f_end in fault_runs:
        r_start = max(0.0, f_start - 100.0)
        r_end = min(tunnel_max, f_end + 100.0)
        red_intervals.append((r_start, r_end))
        
        y_start = max(0.0, r_start - 900.0)
        y_end = min(tunnel_max, r_end + 900.0)
        yellow_intervals.append((y_start, y_end))
        
    # 3. Create a 1-meter grid to resolve priority overlap and overrides
    grid = ['low'] * int(tunnel_max)
    
    for y_start, y_end in yellow_intervals:
        idx_start = int(max(0, math.floor(y_start)))
        idx_end = int(min(tunnel_max, math.ceil(y_end)))
        for i in range(idx_start, idx_end):
            grid[i] = 'moderate'
            
    for r_start, r_end in red_intervals:
        idx_start = int(max(0, math.floor(r_start)))
        idx_end = int(min(tunnel_max, math.ceil(r_end)))
        for i in range(idx_start, idx_end):
            grid[i] = 'high'
            
    for i in range(0, min(100, len(grid))):
        grid[i] = 'low'
    for i in range(max(0, int(tunnel_max - 100.0)), len(grid)):
        grid[i] = 'low'
        
    # 4. Group grid into contiguous runs
    runs = []
    current_color = grid[0]
    current_start = 0.0
    
    for i in range(1, len(grid)):
        if grid[i] != current_color:
            runs.append({
                "start": current_start,
                "end": float(i),
                "hazard": current_color
            })
            current_color = grid[i]
            current_start = float(i)
    runs.append({
        "start": current_start,
        "end": tunnel_max,
        "hazard": current_color
    })
    
    return {"zones": runs, "faults": raw_faults}

_cached_observations = None

def _load_combined_observations():
    global _cached_observations
    if _cached_observations is not None:
        return _cached_observations
        
    geotech_path = os.path.join(DATA_DIR, 'geotech_prediction_dataset_filled-export.csv')
    joint_path = os.path.join(DATA_DIR, 'Tunnel_Joint_Dataset_Cleaned.csv')
    pred_path = os.path.join(DATA_DIR, 'all_chainages_predictions (4).csv')

    if not os.path.exists(geotech_path) or not os.path.exists(joint_path) or not os.path.exists(pred_path):
        return []

    # Load joint dataset rows keyed by Chainage
    joint_rows = {}
    try:
        with open(joint_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for r in reader:
                ch_str = r.get('Chainage')
                if ch_str:
                    try:
                        joint_rows[round(float(ch_str), 1)] = r
                    except ValueError:
                        pass
    except Exception as e:
        print("Error loading Tunnel_Joint_Dataset_Cleaned.csv:", e)

    # Load prediction dataset rows keyed by Chainage
    pred_rows = {}
    try:
        with open(pred_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for r in reader:
                ch_str = r.get('Chainage')
                if ch_str:
                    try:
                        pred_rows[round(float(ch_str), 1)] = r
                    except ValueError:
                        pass
    except Exception as e:
        print("Error loading all_chainages_predictions (4).csv:", e)

    # Load main geotech dataset and combine aligned rows
    raw_rows = []
    try:
        with open(geotech_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for r in reader:
                ch_str = r.get('Chainage')
                if ch_str:
                    try:
                        ch = float(ch_str)
                        ch_key = round(ch, 1)
                        jr = joint_rows.get(ch_key, {})
                        pr = pred_rows.get(ch_key, {})
                        combined = {**r, **jr, **pr}
                        raw_rows.append((ch, combined))
                    except ValueError:
                        pass
    except Exception as e:
        print("Error loading geotech_prediction_dataset_filled-export.csv:", e)
        return []

    # Sort by Chainage ascending
    raw_rows.sort(key=lambda x: x[0])

    # Filter out empty observations
    valid_rows = []
    for ch, r in raw_rows:
        rmr_val = r.get('RMR_Value')
        gsi_val = r.get('GSI_Value')
        ground = r.get('Primary_Lithology')
        support = r.get('Expected_Support_Class_Design')
        if not ground and (not rmr_val or rmr_val == "") and (not gsi_val or gsi_val == "") and not support:
            continue
        valid_rows.append((ch, r))

    _cached_observations = valid_rows
    return _cached_observations

_cached_segments = None

def get_segments():
    global _cached_segments
    if _cached_segments is not None:
        return _cached_segments

    valid_rows = _load_combined_observations()
    if not valid_rows:
        return load_json_file('segments.json')

    # Load dynamic hazard runs
    haz_info = get_hazard_zones()
    hazard_runs = haz_info.get("zones", [])

    cfg = AGGREGATION_CONFIG["clustering"]
    weights = cfg["weights"]
    max_dist = cfg["max_distance"]
    split_threshold = cfg["split_threshold"]

    def get_val_float(r, key):
        val = r.get(key)
        if val and val != "" and val != "-":
            try:
                return float(val)
            except ValueError:
                pass
        return None

    # Step 1: Iterate through each hazard run and perform dissimilarity clustering independently inside that zone
    clustered_sections = []
    for zone in hazard_runs:
        z_start = zone["start"]
        z_end = zone["end"]
        
        # Filter observations that fall inside this hazard zone
        zone_rows = [(ch, r) for ch, r in valid_rows if z_start <= ch < z_end]
        if not zone_rows:
            continue
            
        # Cluster zone_rows sequentially
        zone_clusters = []
        current_section = []
        
        for ch, r in zone_rows:
            if not current_section:
                current_section.append((ch, r))
                continue
                
            start_ch, start_r = current_section[0]
            dist_from_start = ch - start_ch
            score = 0.0
            
            # Lithology dissimilarity
            if normalize_lithology(r.get('Primary_Lithology')) != normalize_lithology(start_r.get('Primary_Lithology')):
                score += weights["lithology"] * 10.0
            
            # Support class dissimilarity
            sc_curr = r.get('Expected_Support_Class_Design', '')
            sc_start = start_r.get('Expected_Support_Class_Design', '')
            if sc_curr and sc_start:
                if sc_curr[0] != sc_start[0]:
                    score += weights["support_class"] * 10.0
            elif (sc_curr and not sc_start) or (not sc_curr and sc_start):
                score += weights["support_class"] * 5.0
                
            # Groundwater dissimilarity
            if normalize_groundwater(r.get('Groundwater_Class')) != normalize_groundwater(start_r.get('Groundwater_Class')):
                score += weights["groundwater"] * 10.0
                
            # Fault presence dissimilarity
            if normalize_fault(r.get('In_Fault_Zone')) != normalize_fault(start_r.get('In_Fault_Zone')):
                score += weights["fault_presence"] * 10.0
                
            # RMR dissimilarity
            rmr_curr = get_val_float(r, 'RMR_Value')
            rmr_start = get_val_float(start_r, 'RMR_Value')
            if rmr_curr is not None and rmr_start is not None:
                score += weights["rmr"] * abs(rmr_curr - rmr_start)
                
            # GSI dissimilarity
            gsi_curr = get_val_float(r, 'GSI_Value')
            gsi_start = get_val_float(start_r, 'GSI_Value')
            if gsi_curr is not None and gsi_start is not None:
                score += weights["gsi"] * abs(gsi_curr - gsi_start)
                
            if score > split_threshold or dist_from_start > max_dist:
                zone_clusters.append(current_section)
                current_section = [(ch, r)]
            else:
                current_section.append((ch, r))
                
        if current_section:
            zone_clusters.append(current_section)
            
        for sec in zone_clusters:
            clustered_sections.append((sec, zone))

    # Step 2: Generate canonical segment objects from clustered sections
    segments = []

    for idx, (sec, zone) in enumerate(clustered_sections):
        z_start = zone["start"]
        z_end = zone["end"]
        z_color = zone["hazard"]
        
        # Calculate boundaries clamped exactly within the current hazard zone
        if idx == 0:
            start_ch = 0.0
        else:
            prev_last = clustered_sections[idx-1][0][-1][0]
            curr_first = sec[0][0]
            prev_zone = clustered_sections[idx-1][1]
            if prev_zone != zone:
                start_ch = z_start
            else:
                start_ch = (prev_last + curr_first) / 2.0
                
        if idx < len(clustered_sections) - 1:
            curr_last = sec[-1][0]
            next_first = clustered_sections[idx+1][0][0][0]
            next_zone = clustered_sections[idx+1][1]
            if next_zone != zone:
                end_ch = z_end
            else:
                end_ch = (curr_last + next_first) / 2.0
        else:
            end_ch = 10461.0

        length = end_ch - start_ch
        hazard = z_color

        # Helper to find dominant string value
        def dom_val(key, default="N/A"):
            vals = [r.get(key, "").strip() for _, r in sec if r.get(key) is not None and r.get(key).strip() != "" and r.get(key).strip() != "-"]
            return max(set(vals), key=vals.count) if vals else default

        # Expose Representative Values
        dominant_lith = normalize_lithology(dom_val('Primary_Lithology', 'Unclassified'))
        weathering_grade = dom_val('Weathering_Grade', 'Slightly weathered')
        dominant_support = dom_val('Expected_Support_Class_Design', 'N/A')
        predicted_support = dom_val('Predicted_Support_Class', 'N/A')
        
        # Settle Groundwater categories
        gw_classes = [normalize_groundwater(r.get('Groundwater_Class')) for _, r in sec]
        most_severe_gw = 'Dry'
        if 'Wet' in gw_classes:
            most_severe_gw = 'Wet'
        elif 'Damp' in gw_classes:
            most_severe_gw = 'Damp'

        # Exception: True if ANY contains a fault
        faults_present = [normalize_fault(r.get('In_Fault_Zone')) for _, r in sec]
        fault_present_bool = (1 in faults_present)

        # Statistical mappings
        def get_stat_dict(key):
            values = [get_val_float(r, key) for _, r in sec]
            clean_vals = [v for v in values if v is not None]
            if not clean_vals:
                return {"mean": None, "min": None, "max": None}
            return {
                "mean": round(sum(clean_vals) / len(clean_vals), 1),
                "min": min(clean_vals),
                "max": max(clean_vals)
            }

        rmr_stats = get_stat_dict('RMR_Value')
        gsi_stats = get_stat_dict('GSI_Value')
        rqd_stats = get_stat_dict('RQD_Value')
        
        # Estimate Q-system stats based on standard engineering correlation
        def rmr_to_q(rmr):
            if rmr is None:
                return None
            try:
                return round(math.exp((rmr - 44.0) / 9.0), 3)
            except:
                return None
        
        q_mean = rmr_to_q(rmr_stats["mean"])
        q_min = rmr_to_q(rmr_stats["min"])
        q_max = rmr_to_q(rmr_stats["max"])
        q_stats = {"mean": q_mean, "min": q_min, "max": q_max}

        # Fault prediction probability from model
        fault_probs = [get_val_float(r, 'Predicted_Fault_Probability') for _, r in sec]
        clean_f_probs = [v for v in fault_probs if v is not None]
        avg_fault_prob = sum(clean_f_probs) / len(clean_f_probs) if clean_f_probs else 0.0

        # Groundwater Inflows
        water_inflows = [get_val_float(r, 'Water_Inflow_LPM') for _, r in sec]
        clean_inflows = [v for v in water_inflows if v is not None]
        avg_water_inflow = sum(clean_inflows) / len(clean_inflows) if clean_inflows else 0.0

        # Actual ML Prediction Confidence
        confidences = [get_val_float(r, 'Prediction_Confidence') for _, r in sec]
        clean_confs = [v for v in confidences if v is not None]
        avg_prediction_confidence = sum(clean_confs) / len(clean_confs) if clean_confs else 0.82

        # Concatenate unique notes
        unique_notes = list(set(r.get('special_geological_features_Raw_Text', '').strip() for _, r in sec if r.get('special_geological_features_Raw_Text') is not None and r.get('special_geological_features_Raw_Text').strip() != ''))
        engineer_notes = " ".join(unique_notes)

        # 3. Weighted Geotechnical Hazard Rating Engine
        hazard_cfg = AGGREGATION_CONFIG["hazard_scoring"]
        h_weights = hazard_cfg["weights"]
        h_thresholds = hazard_cfg["thresholds"]

        h_score_sum = 0.0
        h_weight_sum = 0.0

        h_score_sum += h_weights["fault_presence"] * (10.0 if fault_present_bool else 0.0)
        h_weight_sum += h_weights["fault_presence"]

        gw_severity = 10.0 if most_severe_gw == 'Wet' else (5.0 if most_severe_gw == 'Damp' else 0.0)
        h_score_sum += h_weights["groundwater"] * gw_severity
        h_weight_sum += h_weights["groundwater"]

        if rmr_stats["mean"] is not None:
            rmr_severity = 10.0 if rmr_stats["mean"] < 40 else (5.0 if rmr_stats["mean"] < 60 else 1.0)
            h_score_sum += h_weights["rmr"] * rmr_severity
            h_weight_sum += h_weights["rmr"]

        if gsi_stats["mean"] is not None:
            gsi_severity = 10.0 if gsi_stats["mean"] < 40 else (5.0 if gsi_stats["mean"] < 60 else 1.0)
            h_score_sum += h_weights["gsi"] * gsi_severity
            h_weight_sum += h_weights["gsi"]

        if q_stats["mean"] is not None:
            q_severity = 10.0 if q_stats["mean"] < 1.0 else (5.0 if q_stats["mean"] < 10.0 else 1.0)
            h_score_sum += h_weights["q_system"] * q_severity
            h_weight_sum += h_weights["q_system"]

        if dominant_support != 'N/A':
            sup_severity = 10.0 if dominant_support.startswith('C') else (5.0 if dominant_support.startswith('B') else 1.0)
            h_score_sum += h_weights["support_class"] * sup_severity
            h_weight_sum += h_weights["support_class"]

        water_severity = 10.0 if avg_water_inflow > 50 else (5.0 if avg_water_inflow > 10 else 0.0)
        h_score_sum += h_weights["water_inflow"] * water_severity
        h_weight_sum += h_weights["water_inflow"]

        normalized_hazard_score = h_score_sum / h_weight_sum if h_weight_sum > 0 else 0.0

        confidence_pct = int(avg_prediction_confidence * 100)

        # Geotechnical Summary Card description
        summary = generate_summary(dominant_lith, rmr_stats["mean"], gsi_stats["mean"], most_severe_gw, dominant_support, weathering_grade)

        # 4. Geological conditions attributes mapping
        rmr_strength_mean = get_stat_dict('RMR_Strength')["mean"]
        rock_strength_lbl = "Medium Strong"
        if rmr_strength_mean is not None:
            if rmr_strength_mean >= 12:
                rock_strength_lbl = "Very Strong"
            elif rmr_strength_mean >= 7:
                rock_strength_lbl = "Strong"
            elif rmr_strength_mean >= 4:
                rock_strength_lbl = "Medium Strong"
            else:
                rock_strength_lbl = "Weak"

        geological_conditions = {
            "lithology": dominant_lith,
            "formation": "Himank Complex" if dominant_lith != "Gneiss" else "Vaikrita Group Gneissic Series",
            "weatheringGrade": weathering_grade,
            "rockStrength": rock_strength_lbl,
            "groundwaterClass": dom_val('Groundwater_Class', 'Dry'),
            "seepage": dom_val('Seepage_Intensity', 'Dry'),
            "waterInflow": round(avg_water_inflow, 1)
        }

        # 5. Rock mass behaviour attributes mapping
        modes_low = " ".join(r.get('Rockmass_Failure_Modes', '').lower() for _, r in sec)
        behaviour_flags = []
        if 'wg' in modes_low or 'wedge' in modes_low or 'wedge' in engineer_notes.lower():
            behaviour_flags.append("Wedge Formation")
        if 'sq' in modes_low or 'squeez' in modes_low or 'squeez' in engineer_notes.lower():
            behaviour_flags.append("Squeezing Ground")
        if 'sw' in modes_low or 'swell' in modes_low or 'swell' in engineer_notes.lower():
            behaviour_flags.append("Swelling Ground")
        if 'rb' in modes_low or 'rockburst' in engineer_notes.lower():
            behaviour_flags.append("Rockburst Potential")
        if 'ch' in modes_low or 'chimney' in modes_low or 'chimney' in engineer_notes.lower():
            behaviour_flags.append("Chimney Caving")
        if 'block' in modes_low or 'blocky' in engineer_notes.lower():
            behaviour_flags.append("Blocky Ground")
            
        rock_behaviour = {
            "failureModes": dom_val('Rockmass_Failure_Modes'),
            "faceStability": dom_val('Face_Stability', 'Stable'),
            "deformationTolerance": dom_val('Deformation_Tolerance_mm', '50'),
            "behaviourFlags": behaviour_flags,
            "numberJointSets": dom_val('Number_of_Joint_Sets', '3')
        }

        # 6. Detailed Support specification design mapping
        support_system = {
            "supportClass": dominant_support,
            "predictedSupportClass": predicted_support,
            "shotcreteThickness": dom_val('Shotcrete_Thickness_mm', '300') + " mm",
            "rockboltType": dom_val('Rockbolt_Type', 'SN bolt'),
            "rockboltLength": dom_val('Rockbolt_Length_m', '4m'),
            "rockboltSpacing": f"{dom_val('Rockbolt_Longitudinal_Spacing_m', '1.5m')} x {dom_val('Rockbolt_Transverse_Spacing_m', '1.5m')}",
            "steelRibs": dom_val('Steel_Ribs_Type', 'N/A'),
            "latticeGirder": f"{dom_val('Lattice_Girder_Bar_Dia_mm', '115/25/20')} mm @ {dom_val('Lattice_Girder_Spacing_m', '1.2m')}",
            "crownSupport": dom_val('Crown_Support_Spec', 'N/A'),
            "faceSupport": f"Shotcrete {dom_val('Face_Support_Shotcrete_mm', '100')} mm / Bolts {dom_val('Face_Support_Bolts_Spec', 'N/A')}",
            "finalLining": f"Crown {dom_val('Crown_Final_Lining_Thickness_mm', '400')} mm / Invert {dom_val('Final_Lining_Invert_Thickness_mm', 'N/A')} mm"
        }

        # 7. RMR rating component breakdown mapping
        def get_rmr_subscore(key):
            vals = [get_val_float(r, key) for _, r in sec]
            clean = [v for v in vals if v is not None]
            return round(sum(clean) / len(clean), 1) if clean else 0.0

        rmr_breakdown = {
            "strength": get_rmr_subscore('RMR_Strength'),
            "rqd": get_rmr_subscore('RMR_RQD'),
            "spacing": get_rmr_subscore('RMR_Spacing'),
            "condition": get_rmr_subscore('RMR_Discontinuity_Cond') or get_rmr_subscore('RMR_Persistence') + get_rmr_subscore('RMR_Separation') + get_rmr_subscore('RMR_Roughness') + get_rmr_subscore('RMR_Filling') + get_rmr_subscore('RMR_Weathering'),
            "groundwater": get_rmr_subscore('RMR_Groundwater'),
            "adjustment": get_rmr_subscore('RMR_Orientation_Adj')
        }

        # 8. Structural Discontinuity Joint sets mapping
        def get_joint_set(prefix):
            j_dips = [get_val_float(r, f"{prefix}_Dip_deg") for _, r in sec]
            j_dip_dirs = [get_val_float(r, f"{prefix}_DipDir_deg") for _, r in sec]
            j_strikes = [get_val_float(r, f"{prefix}_Strike_deg") for _, r in sec]
            j_spacings = [get_val_float(r, f"{prefix}_Spacing_cm") for _, r in sec]
            j_persistences = [get_val_float(r, f"{prefix}_Persistence_m") for _, r in sec]
            j_apertures = [get_val_float(r, f"{prefix}_Aperture_mm") for _, r in sec]
            
            clean_dips = [v for v in j_dips if v is not None]
            clean_dip_dirs = [v for v in j_dip_dirs if v is not None]
            clean_strikes = [v for v in j_strikes if v is not None]
            clean_spacings = [v for v in j_spacings if v is not None]
            clean_persistences = [v for v in j_persistences if v is not None]
            clean_apertures = [v for v in j_apertures if v is not None]

            return {
                "dip": round(sum(clean_dips) / len(clean_dips), 1) if clean_dips else None,
                "dipDir": round(sum(clean_dip_dirs) / len(clean_dip_dirs), 1) if clean_dip_dirs else None,
                "strike": round(sum(clean_strikes) / len(clean_strikes), 1) if clean_strikes else None,
                "spacing": round(sum(clean_spacings) / len(clean_spacings), 1) if clean_spacings else None,
                "persistence": round(sum(clean_persistences) / len(clean_persistences), 1) if clean_persistences else None,
                "aperture": round(sum(clean_apertures) / len(clean_apertures), 1) if clean_apertures else None,
                "roughness": dom_val(f"{prefix}_Roughness_label"),
                "infill": dom_val(f"{prefix}_Infill_label"),
                "weathering": dom_val(f"{prefix}_Weathering_label")
            }

        joint_sets = {
            "J1": get_joint_set("J1"),
            "J2": get_joint_set("J2"),
            "J3": get_joint_set("J3")
        }

        # 9. Data Quality aggregation completeness
        important_attrs = {
            "RMR": rmr_stats["mean"],
            "GSI": gsi_stats["mean"],
            "Q-System": q_stats["mean"],
            "Lithology": dominant_lith if dominant_lith != 'Unclassified' else None,
            "Support Class": dominant_support if dominant_support != 'N/A' else None,
            "Groundwater Class": most_severe_gw if most_severe_gw != 'Dry' else None,
            "Fault Presence": fault_present_bool if fault_present_bool else None
        }
        missing_fields = [k for k, v in important_attrs.items() if v is None]
        completeness = (len(important_attrs) - len(missing_fields)) / len(important_attrs)

        segment = {
            "id": idx + 1,
            "startChainage": start_ch,
            "endChainage": end_ch,
            "length": length,
            "hazard": hazard,
            "confidence": confidence_pct,
            "lithology": dominant_lith,
            "rmr": rmr_stats,
            "gsi": gsi_stats,
            "rqd": rqd_stats,
            "qSystem": q_stats,
            "groundwater": most_severe_gw,
            "supportClass": dominant_support,
            "faultPresent": fault_present_bool,
            "summary": summary,
            "engineerNotes": engineer_notes,
            "geologicalConditions": geological_conditions,
            "rockBehaviour": rock_behaviour,
            "supportSystem": support_system,
            "rmrBreakdown": rmr_breakdown,
            "jointSets": joint_sets,
            "probability": {
                "fault": int(avg_fault_prob * 100),
                "water": None,
                "groundBehaviour": rock_behaviour["failureModes"],
                "tunnelDeformation": rock_behaviour["deformationTolerance"] + " mm"
            },
            "aggregationMetadata": {
                "rowCount": len(sec),
                "completeness": round(completeness, 2),
                "missingFields": missing_fields
            }
        }
        segments.append(segment)

    _cached_segments = segments
    return segments

def to_float(val):
    if val is None or val == "":
        return 0.0
    try:
        return float(val)
    except ValueError:
        return 0.0

def generate_summary(lith, rmr, gsi, gw, support, weathering="slightly weathered"):
    if not lith or lith == 'Unclassified':
        return "Summary will be generated by the Explainable AI module."
    rmr_text = f"RMR {int(rmr)}" if rmr is not None else "unrated RMR"
    gsi_text = f"GSI {int(gsi)}" if gsi is not None else "unrated GSI"

    gw_text = "dry groundwater conditions"
    if gw == 'Wet':
        gw_text = "local groundwater seepage and wet conditions"
    elif gw == 'Damp':
        gw_text = "minor dampness"

    support_text = f"Class {support} support" if support and support != 'N/A' else "standard support"
    return f"This section is dominated by {weathering.lower()} {lith.lower()} with fair rock mass quality ({rmr_text}, {gsi_text}). Groundwater conditions are {gw_text} and {support_text} has been specified."

def load_json_file(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

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
        {"id": "hazard", "name": "Hazard Heat", "category": "overlay", "color": "#E0913F", "default": True},
        {"id": "confidence", "name": "Confidence Map", "category": "overlay", "color": "#4FA6A0", "default": False}
    ]

def get_system_status():
    segments = get_segments()
    total_m = 9800
    if segments:
        total_m = int(max(s['endChainage'] for s in segments))
    return {
        "status": "LIVE",
        "lastSyncMinutesAgo": 2,
        "faceMethod": "NATM — Drill & Blast",
        "excavatedMeters": 4260,
        "totalMeters": total_m
    }

def get_map_route():
    return load_json_file('map_route.json')

def get_map_landslides():
    return load_json_file('map_landslides.json')

def get_map_faults():
    return load_json_file('map_faults.json')

def get_map_boreholes():
    return load_json_file('map_boreholes.json')

def get_map_groundwater():
    return load_json_file('map_groundwater.json')

def get_map_predictions():
    return load_json_file('map_predictions.json')
