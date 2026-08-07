import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CONFIG } from '../config';

// Centralized Layer Registry defining GIS layer properties, styles, and visibility criteria
const LAYER_REGISTRY = [
  {
    id: 'route',
    displayName: 'Tunnel Route',
    style: (feature) => {
      const props = (feature && feature.properties) || {};
      return {
        color: props.stroke || '#E0913F',
        weight: props['stroke-width'] || 4,
        opacity: props['stroke-opacity'] || 0.95
      };
    },
    renderOrder: 1,
    visible: () => true // Route is always visible
  },
  {
    id: 'landslides',
    displayName: 'Landslide Zones',
    style: (feature) => {
      const props = (feature && feature.properties) || {};
      return {
        color: props.stroke || '#D6543F',
        weight: props['stroke-width'] || 1.5,
        opacity: props['stroke-opacity'] || 0.85,
        fillColor: props.fill || '#D6543F',
        fillOpacity: props['fill-opacity'] || 0.35
      };
    },
    renderOrder: 2,
    visible: (layerState) => !!layerState.hazard
  },
  {
    id: 'faults',
    displayName: 'Predicted Lineaments',
    style: (feature) => {
      const props = (feature && feature.properties) || {};
      return {
        color: props.stroke || '#D6543F',
        weight: props['stroke-width'] || 2.5,
        opacity: props['stroke-opacity'] || 0.8
      };
    },
    renderOrder: 3,
    visible: (layerState) => !!layerState.faults
  },
  {
    id: 'boreholes',
    displayName: 'Boreholes',
    style: (feature) => {
      const props = (feature && feature.properties) || {};
      return {
        color: props.stroke || '#D9B23C',
        weight: props['stroke-width'] || 2,
        opacity: props['stroke-opacity'] || 0.9
      };
    },
    renderOrder: 4,
    visible: (layerState) => !!layerState.boreholes
  },
  {
    id: 'groundwater',
    displayName: 'Groundwater Points',
    style: (feature) => {
      const props = (feature && feature.properties) || {};
      return {
        color: props.stroke || '#4F8FA6',
        weight: props['stroke-width'] || 2,
        opacity: props['stroke-opacity'] || 0.9
      };
    },
    renderOrder: 5,
    visible: (layerState) => !!layerState.hydrology
  },
  {
    id: 'predictions',
    displayName: 'Prediction Overlays',
    style: (feature) => {
      const props = (feature && feature.properties) || {};
      return {
        color: props.stroke || '#4FA6A0',
        weight: props['stroke-width'] || 2,
        opacity: props['stroke-opacity'] || 0.9
      };
    },
    renderOrder: 6,
    visible: (layerState) => !!layerState.confidence
  }
];

// Inner controller component to dynamically manage Leaflet size invalidation and fitBounds
function MapController({ routeBounds, activeTab, studyAreaBounds }) {
  const map = useMap();

  useEffect(() => {
    // When switching tabs to plan view, Leaflet size must be invalidated to redraw tiles
    if (activeTab === 'plan') {
      map.invalidateSize();
      if (routeBounds && routeBounds.length > 0) {
        map.fitBounds(routeBounds, { padding: [50, 50] });
      }
    }
  }, [activeTab, routeBounds, map]);

  return null;
}

export default function MapViewport({
  mapData,
  layerState,
  activeTab
}) {
  const basemap = MAP_CONFIG.basemap;

  // Extract latlng list from tunnel route LineString
  const routeBounds = useMemo(() => {
    if (!mapData || !mapData.route || !mapData.route.features) return null;
    const features = mapData.route.features;
    const lineFeature = features.find(f => f.geometry.type === 'LineString');
    if (!lineFeature) return null;
    const coords = lineFeature.geometry.coordinates; // [[lng, lat], ...]
    return coords.map(c => [c[1], c[0]]); // [[lat, lng], ...]
  }, [mapData]);

  // Compute bounding box from route and expand it dynamically using configurable paddings
  const studyAreaBounds = useMemo(() => {
    if (!routeBounds || routeBounds.length === 0) return null;
    
    const lats = routeBounds.map(c => c[0]);
    const lngs = routeBounds.map(c => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Configurable margin parameters (approximately 30-40km buffer area)
    const LAT_PADDING = 0.27; 
    const LNG_PADDING = 0.32;

    const southWest = [minLat - LAT_PADDING, minLng - LNG_PADDING];
    const northEast = [maxLat + LAT_PADDING, maxLng + LNG_PADDING];
    
    return [southWest, northEast];
  }, [routeBounds]);

  const defaultCenter = [33.0874, 75.2860];
  const defaultZoom = 12;

  // Filter and sort active layers from the registry
  const activeLayers = useMemo(() => {
    if (!mapData) return [];
    return [...LAYER_REGISTRY]
      .sort((a, b) => a.renderOrder - b.renderOrder)
      .filter(layer => {
        const geojson = mapData[layer.id];
        const isVisible = layer.visible(layerState);
        return geojson && geojson.features && geojson.features.length > 0 && isVisible;
      });
  }, [mapData, layerState]);

  return (
    <div 
      className="map-viewport-container" 
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {studyAreaBounds ? (
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          minZoom={10}
          maxZoom={18}
          scrollWheelZoom={true}
          zoomControl={false} // Disable default top-left controls to avoid view-tabs overlap
          maxBounds={studyAreaBounds} // Restrict panning to study area bounding box
          maxBoundsViscosity={1.0} // Hard boundary viscosity wall
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution={basemap.attribution}
            url={basemap.url}
          />

          {/* Reposition zoom controls to bottom-left corner to avoid overlapping view-tabs */}
          <ZoomControl position="bottomleft" />

          {/* Dynamic fitBounds and resize invalidation controller */}
          <MapController 
            routeBounds={routeBounds} 
            activeTab={activeTab} 
            studyAreaBounds={studyAreaBounds} 
          />

          {/* Dynamic GeoJSON layer renderer */}
          {activeLayers.map(layer => (
            <GeoJSON 
              key={`${layer.id}-${JSON.stringify(layerState)}`}
              data={mapData[layer.id]} 
              style={layer.style}
              pointToLayer={(feature, latlng) => {
                const isPortal = layer.id === 'route';
                const color = feature.properties && feature.properties.stroke 
                  ? feature.properties.stroke 
                  : (typeof layer.style === 'function' ? layer.style(feature).color : layer.style.color);

                return L.circleMarker(latlng, {
                  radius: isPortal ? 6 : 5,
                  fillColor: isPortal ? '#E7EAEE' : color,
                  color: '#11151A',
                  weight: 1.5,
                  opacity: 1,
                  fillOpacity: 0.95
                });
              }}
              onEachFeature={(feature, leafletLayer) => {
                if (feature.properties && feature.properties.name) {
                  const excludeKeys = new Set([
                    'name', 'description', 'stroke', 'stroke-opacity', 'stroke-width',
                    'fill', 'fill-opacity', 'fill-enabled', 'stroke-enabled'
                  ]);
                  const metadataItems = [];
                  Object.entries(feature.properties).forEach(([key, val]) => {
                    if (!excludeKeys.has(key) && val !== null && val !== undefined && val !== '') {
                      metadataItems.push(`
                        <div style="margin-top: 3px; font-size: 11px;">
                          <span style="color: #666; font-weight: 500;">${key}:</span> 
                          <span style="color: #11151A; font-weight: 600;">${val}</span>
                        </div>
                      `);
                    }
                  });
                  leafletLayer.bindPopup(`
                    <div style="color: #11151A; font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 140px; max-width: 250px;">
                      <strong style="font-size: 13px; display: block; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 3px; margin-bottom: 5px;">
                        ${feature.properties.name}
                      </strong>
                      ${feature.properties.description ? `<div style="margin-top: 5px; font-size: 11.5px; color: #555; font-style: italic;">${feature.properties.description}</div>` : ''}
                      ${metadataItems.length > 0 ? `<div style="margin-top: 5px; border-top: 1px dashed #CBD5E0; padding-top: 5px;">${metadataItems.join('')}</div>` : ''}
                    </div>
                  `);
                }
              }}
            />
          ))}
        </MapContainer>
      ) : (
        <div style={{ padding: '20px', color: 'var(--text-dim)', textAlign: 'center' }}>
          Loading map coordinates...
        </div>
      )}
    </div>
  );
}
