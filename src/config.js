export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const DEFAULT_PROJECT = 'nh44';

// Feature flags
export const FEATURES = {
  xai_endpoint: false,
  llm_integration: false,
  map_visualization: true
};

// Map provider configuration
export const MAP_CONFIG = {
  basemap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  maptiler: {
    url: 'https://api.maptiler.com/maps/basic/256/{z}/{x}/{y}.png?key={key}',
    attribution: '&copy; MapTiler'
  }
};
