import React, { useState, useEffect, useMemo } from 'react';

const hazardColors = {low:'#5FA864', moderate:'#D9B23C', high:'#D6543F'};

export default function Ribbon({
  segments,
  currentSegIdx,
  onSelectSegment,
  totalMeters,
  excavatedMeters,
  hazardZones
}) {
  const TOTAL = totalMeters;
  const FACE_CH = excavatedMeters;
  const [isDragging, setIsDragging] = useState(false);

  const formatCh = (m) => {
    const km = Math.floor(m / 1000);
    const rem = Math.round(m % 1000).toString().padStart(3, '0');
    return `${km}+${rem}`;
  };

  // Compute cursor position and text label
  const { cursorLeft, rangeText } = useMemo(() => {
    if (currentSegIdx === null || !segments || segments.length === 0) {
      return { cursorLeft: 0, rangeText: 'No section selected' };
    }
    const s = segments[currentSegIdx];
    if (!s) return { cursorLeft: 0, rangeText: 'No section selected' };
    const ch = (s.startChainage + s.endChainage) / 2;
    const pct = (ch / TOTAL) * 100;
    return {
      cursorLeft: pct,
      rangeText: `CH ${formatCh(ch)} selected`
    };
  }, [currentSegIdx, segments, TOTAL]);

  const handleRibbonInteraction = (clientX) => {
    const ribbonEl = document.getElementById('ribbon');
    if (!ribbonEl) return;
    const rect = ribbonEl.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const ch = pct * TOTAL;
    const idx = segments.findIndex(s => ch >= s.startChainage && ch < s.endChainage);
    if (idx >= 0) {
      onSelectSegment(idx);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleRibbonInteraction(e.clientX);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return;
      handleRibbonInteraction(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, segments]);

  // Compute ribbon SVG contents statically
  const svgContents = useMemo(() => {
    const zones = hazardZones && hazardZones.length > 0 ? hazardZones : [];

    const rects = [];
    
    // Draw continuous hazard zones (independent of geological sections)
    zones.forEach((z, idx) => {
      const fillCol = hazardColors[z.hazard];
      if (z.start < FACE_CH && z.end > FACE_CH) {
        // Split at face CH
        // Part 1: Behind face (observed)
        const x1 = (z.start / TOTAL) * 1000;
        const x2 = (FACE_CH / TOTAL) * 1000;
        rects.push(
          <rect 
            key={`hazard-${idx}-b`}
            x={x1} 
            y="18" 
            width={x2 - x1} 
            height="28" 
            fill={fillCol} 
            opacity={0.92} 
          />
        );
        // Part 2: Ahead of face (forecast)
        const xStart2 = x2;
        const xEnd2 = (z.end / TOTAL) * 1000;
        rects.push(
          <rect 
            key={`hazard-${idx}-a`}
            x={xStart2} 
            y="18" 
            width={xEnd2 - xStart2} 
            height="28" 
            fill={fillCol} 
            opacity={0.55} 
          />
        );
      } else {
        const isAhead = z.start >= FACE_CH;
        const x1 = (z.start / TOTAL) * 1000;
        const x2 = (z.end / TOTAL) * 1000;
        rects.push(
          <rect 
            key={`hazard-${idx}`}
            x={x1} 
            y="18" 
            width={x2 - x1} 
            height="28" 
            fill={fillCol} 
            opacity={isAhead ? 0.55 : 0.92} 
          />
        );
      }
    });

    // Face marker vertical line
    const fx = (FACE_CH / TOTAL) * 1000;
    rects.push(
      <g key="face-marker">
        <line x1={fx} y1="2" x2={fx} y2="64" stroke="#E7EAEE" strokeWidth="1.5" strokeDasharray="3,2" />
        <text x={fx + 4} y="11" fill="#8B95A3" fontSize="9" fontFamily="IBM Plex Mono">FACE</text>
      </g>
    );

    return rects;
  }, [segments, TOTAL, FACE_CH, hazardZones]);

  // Render ticks dynamically
  const ticksList = useMemo(() => {
    const t = [];
    const step = Math.floor(TOTAL / 5);
    for (let i = 0; i <= 5; i++) {
      const m = Math.min(i * step, TOTAL);
      t.push(<span key={i}>{formatCh(m)}</span>);
    }
    return t;
  }, [TOTAL]);

  return (
    <div className="ribbon-wrap">
      <div className="ribbon-head">
        <span className="ribbon-title">Chainage Risk Ribbon — drag to inspect</span>
        <span className="ribbon-range" id="ribbonRange">{rangeText}</span>
      </div>
      <div 
        className="ribbon" 
        id="ribbon"
        onMouseDown={handleMouseDown}
      >
        <svg id="ribbonSvg" viewBox="0 0 1000 64" preserveAspectRatio="none">
          {svgContents}
        </svg>
        <div 
          className="ribbon-cursor" 
          id="ribbonCursor" 
          style={{ 
            left: `${cursorLeft}%`, 
            display: currentSegIdx !== null ? 'block' : 'none' 
          }}
        ></div>
      </div>
      <div className="ribbon-ticks">
        {ticksList}
      </div>
    </div>
  );
}
