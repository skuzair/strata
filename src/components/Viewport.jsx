import React, { useState, useMemo } from 'react';
import MapViewport from './MapViewport';

const groundColors = {
  'Hard Quartzite':'#C98B4A','Jointed Quartzite':'#B98C5C','Weathered Gneiss':'#A87A56',
  'Fractured Gneiss':'#9A7560','Sheared Phyllite':'#8B6F8F','Fault Gouge':'#6E5A4A','Mixed Ground':'#9B8A6E'
};
const hazardColors = {low:'#5FA864', moderate:'#D9B23C', high:'#D6543F'};
const TOTAL = 9800;
const FACE_CH = 4260;

export default function Viewport({
  segments,
  currentSegIdx,
  layerState,
  isPlaying,
  onSelectSegment,
  onTogglePlay,
  onPrevSegment,
  onNextSegment,
  mapData
}) {
  const w = 1400;
  const h = 560;
  const x0 = 60;
  const x1 = w - 60;
  const tunnelY = 300;
  const tunnelH = 60;
  const mountainBottom = 460;
  const [activeTab, setActiveTab] = useState('profile');

  // Utility to format chainage string
  const formatCh = (m) => {
    const km = Math.floor(m / 1000);
    const rem = Math.round(m % 1000).toString().padStart(3, '0');
    return `${km}+${rem}`;
  };

  // Helper to find segment index at chainage coordinate
  const segAt = (ch) => {
    return segments.findIndex(s => ch >= s.start && ch < s.end);
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
    const sx0 = x0 + (s.start / TOTAL) * (x1 - x0);
    const sx1 = x0 + (s.end / TOTAL) * (x1 - x0);
    return (
      <g key="selection">
        <rect x={sx0} y="50" width={sx1 - sx0} height={h - 100} fill="none" stroke="#E7EAEE" strokeWidth="1.5" strokeDasharray="2,3" opacity="0.85" />
        <rect id="selFill" x={sx0} y="50" width={sx1 - sx0} height={h - 100} fill="#E7EAEE" opacity="0.04" />
      </g>
    );
  }, [currentSegIdx, segments, x0, x1, h]);

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
      
      {/* View Toolset */}
      <div className="view-toolset">
        <div className="tool-btn" title="Zoom in">+</div>
        <div className="tool-btn" title="Zoom out">–</div>
        <div className="tool-btn" title="Reset view">⤢</div>
        <div className="tool-btn" title="Export view">⇩</div>
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
            viewBox={`0 0 ${w} ${h}`} 
            style={{ cursor: 'pointer', display: 'block' }}
            onClick={handleSvgClick}
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

            {/* Borehole Toggles */}
            {layerState.boreholes && [300, 900, 1600, 2700, 3400, 4100].map(bh => {
              const bx = x0 + (bh / TOTAL) * (x1 - x0);
              return (
                <g key={bh}>
                  <line x1={bx} y1={60} x2={bx} y2={tunnelY - 8} stroke="#D9B23C" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.55" />
                  <circle cx={bx} cy={60} r="3.5" fill="#D9B23C" />
                </g>
              );
            })}

            {/* Geology Thin strip */}
            {layerState.geology && segments && segments.map((s, idx) => {
              const sx0 = x0 + (s.start / TOTAL) * (x1 - x0);
              const sx1 = x0 + (s.end / TOTAL) * (x1 - x0);
              return (
                <rect 
                  key={`geo-${idx}`} 
                  x={sx0} 
                  y={tunnelY - 9} 
                  width={sx1 - sx0} 
                  height="6" 
                  fill={groundColors[s.ground]} 
                  opacity="0.85" 
                />
              );
            })}

            {/* Tunnel Alignment Bore Base */}
            <rect x={x0} y={tunnelY} width={x1 - x0} height={tunnelH} fill="#05070A" stroke="#3A4452" strokeWidth="1.5" rx="2" />

            {/* Segment parameters overlay rendering */}
            {segments && segments.map((s, idx) => {
              const sx0 = x0 + (s.start / TOTAL) * (x1 - x0);
              const sx1 = x0 + (s.end / TOTAL) * (x1 - x0);
              const isAhead = s.start >= FACE_CH;

              const fillCol = layerState.hazard ? hazardColors[s.hazard] : "#20262E";
              const fillOp = layerState.hazard ? (isAhead ? 0.28 : 0.65) : (isAhead ? 0.5 : 1);

              return (
                <g key={`tunnel-seg-${idx}`}>
                  {/* Hazard Color / Default Color */}
                  <rect x={sx0} y={tunnelY} width={sx1 - sx0} height={tunnelH} fill={fillCol} opacity={fillOp} />
                  
                  {/* Ahead Border Dash */}
                  {isAhead && (
                    <rect x={sx0} y={tunnelY} width={sx1 - sx0} height={tunnelH} fill="none" stroke="#5C6573" strokeWidth="1" strokeDasharray="5,4" />
                  )}

                  {/* Confidence Hatch Overlay */}
                  {layerState.confidence && isAhead && (
                    <rect x={sx0} y={tunnelY} width={sx1 - sx0} height={tunnelH} fill="url(#hatch)" opacity={s.confidence < 70 ? 0.5 : 0.15} />
                  )}

                  {/* Fault overlay inside bore */}
                  {layerState.faults && s.fault > 60 && (
                    <line 
                      x1={(sx0 + sx1) / 2} 
                      y1={tunnelY + 4} 
                      x2={(sx0 + sx1) / 2} 
                      y2={tunnelY + tunnelH - 4} 
                      stroke="#D6543F" 
                      strokeWidth="2.5" 
                      opacity={isAhead ? 0.55 : 0.95} 
                    />
                  )}

                  {/* Water overlay inside bore */}
                  {layerState.hydrology && s.water > 55 && [0, 1, 2].map(i => {
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

        {/* Geotechnical Legend Panel */}
        <div className="legend">
          <div className="legend-title">Ground Type</div>
          <div className="legend-row"><div className="legend-swatch" style={{ backgroundColor: '#C98B4A' }}></div>Hard / Jointed Rock</div>
          <div className="legend-row"><div className="legend-swatch" style={{ backgroundColor: '#A87A56' }}></div>Weathered Rock</div>
          <div className="legend-row"><div className="legend-swatch" style={{ backgroundColor: '#8B6F8F' }}></div>Sheared Phyllite</div>
          <div className="legend-row"><div className="legend-swatch" style={{ backgroundColor: '#6E5A4A' }}></div>Fault Gouge</div>
          <div className="legend-row"><div className="legend-swatch" style={{ backgroundColor: '#D6543F', height: '3px', borderRadius: '0', alignSelf: 'center' }}></div>Inferred Fault</div>
        </div>

        {/* Scalebar */}
        <div className="scalebar">
          <div className="bar"></div>
          200 m
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
                CH {formatCh(segments[currentSegIdx].start)} – {formatCh(segments[currentSegIdx].end)}
              </div>
            </>
          ) : (
            <>
              <div className="seg" id="chnavSeg">PROJECT OVERVIEW</div>
              <div className="ch" id="chnavCh">CH 0+000 – 9+800</div>
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
