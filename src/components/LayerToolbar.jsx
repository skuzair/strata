import React from 'react';

export default function LayerToolbar({
  layers,
  layerState,
  onToggleLayer
}) {
  // If layers data is not loaded yet, render default chips matching original layout
  const defaultLayers = layers && layers.length > 0 ? layers : [
    { id: "geology", name: "Geology", category: "layer", color: "#C98B4A" },
    { id: "hydrology", name: "Hydrology", category: "layer", color: "#4F8FA6" },
    { id: "faults", name: "Faults & Shear", category: "layer", color: "#D6543F" },
    { id: "boreholes", name: "Boreholes", category: "layer", color: "#D9B23C" },
    { id: "terrain", name: "DEM / Terrain", category: "layer", color: "#7C8B6E" },
    { id: "pointcloud", name: "Point Cloud", category: "layer", color: "#9B8AC4" },
    { id: "hazard", name: "Hazard Heat", category: "overlay", color: "#E0913F" },
    { id: "confidence", name: "Confidence Map", category: "overlay", color: "#4FA6A0" },
    { id: "rmrtrack", name: "RMR Track", category: "lsection", color: "#5FA864" },
    { id: "supporttrack", name: "Support Track", category: "lsection", color: "#D9B23C" }
  ];

  const renderGroup = (categoryKey, labelText) => {
    const groupItems = defaultLayers.filter(l => l.category === categoryKey);
    return (
      <>
        <span className="layerbar-label">{labelText}</span>
        {groupItems.map(l => {
          const isActive = !!layerState[l.id];
          return (
            <div
              key={l.id}
              className={`chip ${isActive ? 'active' : ''}`}
              onClick={() => onToggleLayer(l.id)}
            >
              <span className="dot" style={{ backgroundColor: l.color }}></span>
              {l.name}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="layerbar" id="layerbar">
      {renderGroup('layer', 'LAYERS')}
      <div className="chip-sep"></div>
      {renderGroup('overlay', 'OVERLAY')}
      <div className="chip-sep"></div>
      {renderGroup('lsection', 'L-SECTION')}
    </div>
  );
}
