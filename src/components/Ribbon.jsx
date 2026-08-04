import React, { useState, useEffect, useMemo } from 'react';

const hazardColors = {low:'#5FA864', moderate:'#D9B23C', high:'#D6543F'};
const TOTAL = 9800;
const FACE_CH = 4260;

export default function Ribbon({
  segments,
  currentSegIdx,
  onSelectSegment
}) {
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
    const ch = (s.start + s.end) / 2;
    const pct = (ch / TOTAL) * 100;
    return {
      cursorLeft: pct,
      rangeText: `CH ${formatCh(ch)} selected`
    };
  }, [currentSegIdx, segments]);

  const handleRibbonInteraction = (clientX) => {
    const ribbonEl = document.getElementById('ribbon');
    if (!ribbonEl) return;
    const rect = ribbonEl.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const ch = pct * TOTAL;
    const idx = segments.findIndex(s => ch >= s.start && ch < s.end);
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
    if (!segments || segments.length === 0) return null;

    const rects = [];
    // Hazard heat segments
    segments.forEach((s, idx) => {
      const x1 = (s.start / TOTAL) * 1000;
      const x2 = (s.end / TOTAL) * 1000;
      const w = x2 - x1;
      const isAhead = s.start >= FACE_CH;
      rects.push(
        <rect 
          key={`hazard-${idx}`}
          x={x1} 
          y="18" 
          width={w} 
          height="28" 
          fill={hazardColors[s.hazard]} 
          opacity={isAhead ? 0.55 : 0.92} 
        />
      );
    });

    // Confidence columns
    segments.forEach((s, idx) => {
      const x1 = (s.start / TOTAL) * 1000;
      const x2 = (s.end / TOTAL) * 1000;
      const h = (s.confidence / 100) * 16;
      rects.push(
        <rect 
          key={`conf-${idx}`}
          x={x1} 
          y={50 - h} 
          width={x2 - x1} 
          height={h} 
          fill="#4FA6A0" 
          opacity="0.7" 
        />
      );
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
  }, [segments]);

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
        <span>0+000</span>
        <span>2+000</span>
        <span>4+000</span>
        <span>6+000</span>
        <span>8+000</span>
        <span>9+800</span>
      </div>
    </div>
  );
}
