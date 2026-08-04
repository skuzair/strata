import { API_BASE_URL } from '../config';

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`GIS API Error: ${response.status} ${response.statusText} at ${endpoint}`);
  }
  return response.json();
}

export const gisService = {
  getMapRoute: () => fetchJson('/api/map/route'),
  getMapLandslides: () => fetchJson('/api/map/landslides'),
  getMapFaults: () => fetchJson('/api/map/faults'),
  getMapBoreholes: () => fetchJson('/api/map/boreholes'),
  getMapGroundwater: () => fetchJson('/api/map/groundwater'),
  getMapPredictions: () => fetchJson('/api/map/predictions')
};
