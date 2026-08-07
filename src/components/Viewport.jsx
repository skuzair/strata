import React, { useState, useMemo, useEffect } from 'react';
import MapViewport from './MapViewport';

const groundColors = {
  'Hard Quartzite':'#C98B4A','Jointed Quartzite':'#B98C5C','Weathered Gneiss':'#A87A56',
  'Fractured Gneiss':'#9A7560','Sheared Phyllite':'#8B6F8F','Fault Gouge':'#6E5A4A','Mixed Ground':'#9B8A6E',
  'Sandstone':'#C98B4A','Siltstone':'#B98C5C','Claystone':'#8B6F8F','Silty Clay':'#9A7560','Unclassified':'#4A5568'
};
const hazardColors = {low:'#5FA864', moderate:'#D9B23C', high:'#D6543F'};

export default function Viewport({
  segments,
  currentSegIdx,
  layerState,
  isPlaying,
  onSelectSegment,
  onTogglePlay,
  onPrevSegment,
  onNextSegment,
  mapData,
  totalMeters,
  excavatedMeters,
  hazardZones,
  rawFaults
}) {
  const TOTAL = totalMeters;
  const FACE_CH = excavatedMeters;
  const w = 1400;
  const h = 560;
  const x0 = 60;
  const x1 = w - 60;
  const tunnelY = 300;
  const tunnelH = 60;
  const mountainBottom = 460;
  const [activeTab, setActiveTab] = useState('profile');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startPanX, setStartPanX] = useState(0);
  const [hasMovedDuringClick, setHasMovedDuringClick] = useState(false);
  const [scaleBarWidth, setScaleBarWidth] = useState(60);
  const scaleLengthMeters = TOTAL > 8000 ? 1000 : 500;

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('viewportSvgHolder');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = rect.width / w;
      const baseWidth = scaleLengthMeters * ((x1 - x0) / TOTAL) * ratio * zoom;
      setScaleBarWidth(baseWidth);
    };
    updateWidth();
    const t = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateWidth);
    };
  }, [zoom, scaleLengthMeters, TOTAL, x0, x1, activeTab]);

  // Utility to format chainage string
  const formatCh = (m) => {
    const km = Math.floor(m / 1000);
    const rem = Math.round(m % 1000).toString().padStart(3, '0');
    return `${km}+${rem}`;
  };

  // Helper to find segment index at chainage coordinate
  const segAt = (ch) => {
    return segments.findIndex(s => ch >= s.startChainage && ch < s.endChainage);
  };

  // Center zoom on current selected segment, or default center
  const currentCenter = useMemo(() => {
    if (currentSegIdx !== null && segments && segments[currentSegIdx]) {
      const s = segments[currentSegIdx];
      const ch = (s.startChainage + s.endChainage) / 2;
      return x0 + (ch / TOTAL) * (x1 - x0);
    }
    return w / 2;
  }, [currentSegIdx, segments, TOTAL, x0, x1]);

  const viewW = w / zoom;
  const maxPanX = w - viewW;
  const viewBoxStr = `${panX} 0 ${viewW} ${h}`;

  const handleZoomIn = () => {
    setZoom(prev => {
      const next = Math.min(prev + 0.25, 4.0);
      const newViewW = w / next;
      let newPan = currentCenter - newViewW / 2;
      newPan = Math.max(0, Math.min(newPan, w - newViewW));
      setPanX(newPan);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - 0.25, 1.0);
      const newViewW = w / next;
      let newPan = currentCenter - newViewW / 2;
      newPan = Math.max(0, Math.min(newPan, w - newViewW));
      setPanX(newPan);
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanX(0);
  };

  const handleExportSvg = () => {
    const svgEl = document.querySelector('#viewportSvgHolder svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `strata_geological_profile.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Drag to pan handlers
  const handleMouseDown = (e) => {
    setHasMovedDuringClick(false);
    if (zoom > 1) {
      setIsPanning(true);
      setStartX(e.clientX);
      setStartPanX(panX);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        setHasMovedDuringClick(true);
      }
      const container = document.getElementById('viewportSvgHolder');
      const screenWidth = container ? container.getBoundingClientRect().width : w;
      const svgDx = dx * (viewW / screenWidth);
      let newPan = startPanX - svgDx;
      newPan = Math.max(0, Math.min(newPan, maxPanX));
      setPanX(newPan);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // Compute mountain cross-section points dynamically
  const mountainPoints = useMemo(() => {
    const ridgeBase = tunnelY - 8;
    const ridgePeakY = 46;
    let pts = `${x0},${ridgeBase} `;
    const nSteps = 60;
    
    for (let i = 0; i <= nSteps; i++) {
      const t = i / nSteps;
      const x = x0 + t * (x1 - x0);
      const envelope = Math.pow(Math.sin(Math.PI * t), 0.6);
      const baseY = ridgeBase - envelope * (ridgeBase - ridgePeakY);
      const texture = Math.sin(t * 37 + 1.3) * 10 + Math.cos(t * 19 + 0.4) * 7 + Math.sin(t * 71) * 3.5;
      const y = baseY + texture * (0.35 + 0.65 * envelope);
      pts += `${x.toFixed(1)},${y.toFixed(1)} `;
    }
    pts += `${x1},${ridgeBase} ${x1},${mountainBottom} ${x0},${mountainBottom}`;
    return pts;
  }, [x0, x1, tunnelY, mountainBottom]);

  // Compute mountain ridge path outline
  const ridgePath = useMemo(() => {
    const ridgeBase = tunnelY - 8;
    const ridgePeakY = 46;
    let path = `M ${x0},${ridgeBase} `;
    const nSteps = 60;

    for (let i = 0; i <= nSteps; i++) {
      const t = i / nSteps;
      const x = x0 + t * (x1 - x0);
      const envelope = Math.pow(Math.sin(Math.PI * t), 0.6);
      const baseY = ridgeBase - envelope * (ridgeBase - ridgePeakY);
      const texture = Math.sin(t * 37 + 1.3) * 10 + Math.cos(t * 19 + 0.4) * 7 + Math.sin(t * 71) * 3.5;
      const y = baseY + texture * (0.35 + 0.65 * envelope);
      path += `L ${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return path;
  }, [x0, x1, tunnelY]);

  const handleSvgClick = (e) => {
    if (hasMovedDuringClick) return;
    const svgEl = e.currentTarget;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(svgEl.getScreenCTM().inverse());
    if (loc.x < x0 || loc.x > x1) return;
    const ch = ((loc.x - x0) / (x1 - x0)) * TOTAL;
    const idx = segAt(ch);
    if (idx >= 0) {
      onSelectSegment(idx);
    }
  };

  const faceX = x0 + (FACE_CH / TOTAL) * (x1 - x0);

  // Render chainage ticks elements
  const ticks = [];
  for (let ch = 0; ch <= TOTAL; ch += 1000) {
    const cx = x0 + (ch / TOTAL) * (x1 - x0);
    ticks.push(
      <g key={ch}>
        <line x1={cx} y1={h - 46} x2={cx} y2={h - 40} stroke="#5C6573" strokeWidth="1" />
        <text x={cx} y={h - 26} textAnchor="middle" fill="#5C6573" fontFamily="IBM Plex Mono" fontSize="10">
          {formatCh(ch)}
        </text>
      </g>
    );
  }

  // Selected segment bounds for highlight outline
  const selectedRects = useMemo(() => {
    if (currentSegIdx === null || !segments || segments.length === 0) return null;
    const s = segments[currentSegIdx];
    if (!s) return null;
    const sx0 = x0 + (s.startChainage / TOTAL) * (x1 - x0);
    const sx1 = x0 + (s.endChainage / TOTAL) * (x1 - x0);
    return (
      <g key="selection">
        <rect x={sx0} y="50" width={sx1 - sx0} height={h - 100} fill="none" stroke="#E7EAEE" strokeWidth="1.5" strokeDasharray="2,3" opacity="0.85" />
        <rect id="selFill" x={sx0} y="50" width={sx1 - sx0} height={h - 100} fill="#E7EAEE" opacity="0.04" />
      </g>
    );
  }, [currentSegIdx, segments, x0, x1, h, TOTAL]);

  const renderedHazardRects = useMemo(() => {
    const zones = hazardZones && hazardZones.length > 0 ? hazardZones : [];

    const rects = [];
    zones.forEach((z, idx) => {
      const fillCol = layerState.hazard ? hazardColors[z.hazard] : "#20262E";
      if (z.start < FACE_CH && z.end > FACE_CH) {
        // Split at face
        const xStart1 = x0 + (z.start / TOTAL) * (x1 - x0);
        const xEnd1 = x0 + (FACE_CH / TOTAL) * (x1 - x0);
        const op1 = layerState.hazard ? 0.65 : 1.0;
        rects.push(
          <rect key={`haz-zone-${idx}-b`} x={xStart1} y={tunnelY} width={xEnd1 - xStart1} height={tunnelH} fill={fillCol} opacity={op1} />
        );
        const xStart2 = xEnd1;
        const xEnd2 = x0 + (z.end / TOTAL) * (x1 - x0);
        const op2 = layerState.hazard ? 0.28 : 0.5;
        rects.push(
          <rect key={`haz-zone-${idx}-a`} x={xStart2} y={tunnelY} width={xEnd2 - xStart2} height={tunnelH} fill={fillCol} opacity={op2} />
        );
      } else {
        const isAhead = z.start >= FACE_CH;
        const xStart = x0 + (z.start / TOTAL) * (x1 - x0);
        const xEnd = x0 + (z.end / TOTAL) * (x1 - x0);
        const op = layerState.hazard ? (isAhead ? 0.28 : 0.65) : (isAhead ? 0.5 : 1.0);
        rects.push(
          <rect key={`haz-zone-${idx}`} x={xStart} y={tunnelY} width={xEnd - xStart} height={tunnelH} fill={fillCol} opacity={op} />
        );
      }
    });
    return rects;
  }, [layerState.hazard, FACE_CH, TOTAL, x0, x1, tunnelY, tunnelH, hazardZones]);



  return (
    <div className="viewport">
      {/* View Tabs */}
      <div className="view-tabs">
        <div 
          className={`view-tab ${activeTab === 'profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('profile')}
        >
          Geological Profile
        </div>
        <div 
          className={`view-tab ${activeTab === 'plan' ? 'active' : ''}`} 
          onClick={() => setActiveTab('plan')}
        >
          Plan / GIS
        </div>
        <div 
          className={`view-tab ${activeTab === '3d' ? 'active' : ''}`} 
          onClick={() => setActiveTab('3d')}
        >
          3D Block Model
        </div>
      </div>
      
      {/* View Toolset with active click functions */}
      <div className="view-toolset">
        <div className="tool-btn" title="Zoom in" onClick={handleZoomIn}>+</div>
        <div className="tool-btn" title="Zoom out" onClick={handleZoomOut}>–</div>
        <div className="tool-btn" title="Reset view" onClick={handleZoomReset}>⤢</div>
        <div className="tool-btn" title="Export profile to vector SVG file" onClick={handleExportSvg}>⇩</div>
      </div>

      {/* SVG geological profile container (kept mounted to preserve selection states) */}
      <div 
        id="viewportSvgContainer"
        style={{ display: activeTab === 'profile' ? 'block' : 'none', height: '100%', position: 'relative' }}
      >
        {/* Viewport SVG Holder */}
        <div id="viewportSvgHolder">
          <svg 
            width="100%" 
            height="100%" 
            viewBox={viewBoxStr} 
            style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'pointer', display: 'block' }}
            onClick={handleSvgClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A2027" />
                <stop offset="100%" stopColor="#11151A" />
              </linearGradient>
              <linearGradient id="rockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#23282F" />
                <stop offset="100%" stopColor="#161A1F" />
              </linearGradient>
              <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#4FA6A0" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Sky background */}
            <rect x="0" y="0" width={w} height={h} fill="url(#skyGrad)" />

            {/* Mountain Silhouette */}
            <polygon points={mountainPoints} fill="url(#rockGrad)" opacity="0.9" />
            <path d={ridgePath} fill="none" stroke="#333B45" strokeWidth="1.5" opacity="0.8" />
            <text x={(x0 + x1) / 2} y={36} textAnchor="middle" fill="#5C6573" fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="1">
              MOUNTAIN CROSS-SECTION — click ridge to inspect chainage
            </text>

            {/* Borehole Toggles with actual coordinates and metadata */}
            {layerState.boreholes && [
              { id: "BH-1", chainage: 360, depth: 75, offset: "0 m" },
              { id: "BH-2", chainage: 1820, depth: 130, offset: "43 m E" },
              { id: "BH-3", chainage: 3760, depth: 135, offset: "±161 m E" },
              { id: "BH-4", chainage: 5417, depth: 100, offset: "±70 m W" },
              { id: "BH-5", chainage: 9153, depth: 75, offset: "±3 m SW" }
            ].map(bh => {
              const bx = x0 + (bh.chainage / TOTAL) * (x1 - x0);
              const tooltipHtml = `
                <div class="tip-content" style="padding: 1px 0;">
                  <div style="font-weight: 600; color: #E7EAEE; margin-bottom: 4px;">${bh.id}</div>
                  <div style="color: var(--text-dim);">Chainage: CH ${formatCh(bh.chainage)}</div>
                  <div style="color: var(--text-dim);">Offset: ${bh.offset}</div>
                  <div style="color: var(--text-dim);">Depth: ${bh.depth} m</div>
                </div>
              `;
              return (
                <g key={bh.id} className="info-ic" style={{ cursor: 'pointer' }}>
                  <line x1={bx} y1={60} x2={bx} y2={tunnelY - 8} stroke="#D9B23C" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.55" />
                  <circle cx={bx} cy={60} r="3.5" fill="#D9B23C" />
                  <foreignObject width="0" height="0">
                    <div className="tip" dangerouslySetInnerHTML={{ __html: tooltipHtml }}></div>
                  </foreignObject>
                </g>
              );
            })}

            {/* Geology Thin strip */}
            {layerState.geology && segments && segments.map((s, idx) => {
              const sx0 = x0 + (s.startChainage / TOTAL) * (x1 - x0);
              const sx1 = x0 + (s.endChainage / TOTAL) * (x1 - x0);
              return (
                <rect 
                  key={`geo-${idx}`} 
                  x={sx0} 
                  y={tunnelY - 9} 
                  width={sx1 - sx0} 
                  height="6" 
                  fill={groundColors[s.lithology]} 
                  opacity="0.85" 
                />
              );
            })}

            {/* Tunnel Alignment Bore Base */}
            <rect x={x0} y={tunnelY} width={x1 - x0} height={tunnelH} fill="#05070A" stroke="#3A4452" strokeWidth="1.5" rx="2" />

            {/* Continuous Hazard Ribbon Background */}
            {renderedHazardRects}

            {/* Segment parameters overlay rendering */}
            {segments && segments.map((s, idx) => {
              const sx0 = x0 + (s.startChainage / TOTAL) * (x1 - x0);
              const sx1 = x0 + (s.endChainage / TOTAL) * (x1 - x0);
              const isAhead = s.startChainage >= FACE_CH;

              return (
                <g key={`tunnel-seg-${idx}`}>
                  
                  {/* Ahead Border Dash */}
                  {isAhead && (
                    <rect x={sx0} y={tunnelY} width={sx1 - sx0} height={tunnelH} fill="none" stroke="#5C6573" strokeWidth="1" strokeDasharray="5,4" />
                  )}

                  {/* Confidence Hatch Overlay */}
                  {layerState.confidence && isAhead && (
                    <rect x={sx0} y={tunnelY} width={sx1 - sx0} height={tunnelH} fill="url(#hatch)" opacity={s.confidence < 70 ? 0.5 : 0.15} />
                  )}

                  {/* Water overlay inside bore */}
                  {layerState.hydrology && (s.groundwater === 'Wet' || s.groundwater === 'Damp') && [0, 1, 2].map(i => {
                    const wx = sx0 + (i + 1) * (sx1 - sx0) / 4;
                    return (
                      <circle 
                        key={`water-${idx}-${i}`} 
                        cx={wx} 
                        cy={tunnelY + tunnelH - 10} 
                        r="2.2" 
                        fill="#4F8FA6" 
                        opacity={isAhead ? 0.5 : 0.85} 
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Exact CSV Fault Lines Rendering */}
            {layerState.faults && rawFaults && rawFaults.map((fCh, idx) => {
              const fx = x0 + (fCh / TOTAL) * (x1 - x0);
              const isAhead = fCh >= FACE_CH;
              return (
                <line 
                  key={`raw-fault-${idx}`}
                  x1={fx} 
                  y1={tunnelY + 1} 
                  x2={fx} 
                  y2={tunnelY + tunnelH - 1} 
                  stroke="#D6543F" 
                  strokeWidth="2.0" 
                  opacity={isAhead ? 0.45 : 0.85} 
                />
              );
            })}

            {/* Tunnel Borders & Center line */}
            <rect x={x0} y={tunnelY} width={x1 - x0} height={tunnelH} fill="none" stroke="#3A4452" strokeWidth="1.5" rx="2" />
            <line x1={x0} y1={tunnelY + tunnelH / 2} x2={x1} y2={tunnelY + tunnelH / 2} stroke="#0B0D10" strokeWidth="1" opacity="0.4" />

            {/* Face boundary marker */}
            <line x1={faceX} y1={tunnelY - 14} x2={faceX} y2={tunnelY + tunnelH + 14} stroke="#E7EAEE" strokeWidth="2" />
            <polygon points={`${faceX},${tunnelY - 14} ${faceX - 7},${tunnelY - 26} ${faceX + 7},${tunnelY - 26}`} fill="#E7EAEE" />
            <text x={faceX} y={tunnelY - 32} textAnchor="middle" fill="#E7EAEE" fontFamily="IBM Plex Mono" fontSize="11" fontWeight="600">
              FACE — CH {formatCh(FACE_CH)}
            </text>

            {/* Ticks */}
            {ticks}

            {/* Current selected highlight boundary */}
            {selectedRects}
          </svg>
        </div>

        {/* Dynamic Context-Aware Geotechnical Legend Panel */}
        <div className="legend">
          <div className="legend-title" style={{ fontSize: '9px', marginBottom: '3px' }}>
            Profile Legend
          </div>
          
          {/* Tunnel Alignment */}
          <div className="legend-row">
            <div style={{ 
              width: '11px', 
              height: '6px', 
              background: '#05070A', 
              border: '1px solid #3A4452', 
              borderRadius: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 1px'
            }}>
              <div style={{ width: '100%', height: '1.5px', background: 'rgba(58,68,82,0.4)' }}></div>
            </div>
            <span>Tunnel Alignment</span>
          </div>

          {/* Boreholes */}
          {layerState.boreholes && (
            <div className="legend-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '11px', height: '11px', justifyContent: 'center', position: 'relative' }}>
                <div style={{ borderLeft: '1px dashed #D9B23C', height: '100%', opacity: 0.65 }}></div>
                <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: '#D9B23C', position: 'absolute' }}></div>
              </div>
              <span>Borehole</span>
            </div>
          )}

          {/* Fault / Shear Zones */}
          {layerState.faults && (
            <div className="legend-row">
              <div style={{ width: '11px', height: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '2px', height: '100%', background: '#D6543F' }}></div>
              </div>
              <span>Fault / Shear Zone</span>
            </div>
          )}

          {/* Groundwater / Water Ingress */}
          {layerState.hydrology && (
            <div className="legend-row">
              <div style={{ width: '11px', height: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#4F8FA6' }}></div>
              </div>
              <span>Water Seepage</span>
            </div>
          )}

          {/* Lithology types currently present */}
          {layerState.geology && Array.from(new Set(segments.map(s => s.lithology))).map(lith => (
            <div className="legend-row" key={lith}>
              <div className="legend-swatch" style={{ backgroundColor: groundColors[lith] || '#4A5568' }}></div>
              <span>{lith}</span>
            </div>
          ))}

          {/* Hazard colors (Low / Moderate / High) */}
          {layerState.hazard && (
            <>
              <div className="legend-title" style={{ fontSize: '8.5px', marginTop: '6px', marginBottom: '2px' }}>
                Hazard Level
              </div>
              <div className="legend-row">
                <div className="legend-swatch" style={{ backgroundColor: '#5FA864' }}></div>
                <span>Low Hazard</span>
              </div>
              <div className="legend-row">
                <div className="legend-swatch" style={{ backgroundColor: '#D9B23C' }}></div>
                <span>Moderate Hazard</span>
              </div>
              <div className="legend-row">
                <div className="legend-swatch" style={{ backgroundColor: '#D6543F' }}></div>
                <span>High Hazard</span>
              </div>
            </>
          )}
        </div>

        {/* Dynamic scale bar in bottom-right corner */}
        <div 
          className="scalebar" 
          style={{ display: activeTab === 'profile' ? 'flex' : 'none' }}
        >
          <div className="bar" style={{ width: `${scaleBarWidth}px` }}></div>
          <span>{scaleLengthMeters} m</span>
        </div>
      </div>

      {/* Map viewport container (kept mounted to preserve Leaflet instance state) */}
      <div 
        id="viewportMapContainer"
        style={{ 
          display: activeTab === 'plan' ? 'block' : 'none', 
          height: '100%',
          position: 'relative'
        }}
      >
        <MapViewport mapData={mapData} layerState={layerState} activeTab={activeTab} />
      </div>

      {/* 3D block model container */}
      <div 
        id="viewport3dContainer"
        style={{ 
          display: activeTab === '3d' ? 'flex' : 'none', 
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontFamily: 'var(--mono)',
          fontSize: '12px'
        }}
      >
        3D BLOCK MODEL VIEWPORT (PLACEHOLDER)
      </div>
      {/* Chainage navigation dashboard */}
      <div className="chnav">
        <div 
          className={`chnav-btn ${currentSegIdx === 0 && !isPlaying ? 'disabled' : ''} ${currentSegIdx === null ? 'disabled' : ''}`} 
          id="chPrev" 
          title="Previous section"
          onClick={onPrevSegment}
        >
          ◀
        </div>
        <div 
          className={`chnav-play ${isPlaying ? 'playing' : ''}`} 
          id="chPlay" 
          title={isPlaying ? "Pause" : "Walk through the tunnel automatically"}
          onClick={onTogglePlay}
        >
          {isPlaying ? '❚❚' : '▶'}
        </div>
        <div 
          className={`chnav-btn ${currentSegIdx === segments.length - 1 && !isPlaying ? 'disabled' : ''} ${currentSegIdx === null ? 'disabled' : ''}`} 
          id="chNext" 
          title="Next section"
          onClick={onNextSegment}
        >
          ▶
        </div>
        <div className="chnav-info">
          {currentSegIdx !== null && segments && segments[currentSegIdx] ? (
            <>
              <div className="seg" id="chnavSeg">SECTION {currentSegIdx + 1} OF {segments.length}</div>
              <div className="ch" id="chnavCh">
                CH {formatCh(segments[currentSegIdx].startChainage)} – {formatCh(segments[currentSegIdx].endChainage)}
              </div>
            </>
          ) : (
            <>
              <div className="seg" id="chnavSeg">PROJECT OVERVIEW</div>
              <div className="ch" id="chnavCh">CH 0+000 – {formatCh(totalMeters)}</div>
            </>
          )}
          <div className="chnav-dots" id="chnavDots">
            {segments && segments.map((_, i) => {
              let dotClass = 'chnav-dot';
              if (currentSegIdx !== null) {
                if (i === currentSegIdx) dotClass += ' current';
                else if (i < currentSegIdx) dotClass += ' done';
              }
              return <div key={i} className={dotClass}></div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
