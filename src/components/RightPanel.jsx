import React, { useState, useMemo } from 'react';

const groundColors = {
  'Hard Quartzite':'#C98B4A','Jointed Quartzite':'#B98C5C','Weathered Gneiss':'#A87A56',
  'Fractured Gneiss':'#9A7560','Sheared Phyllite':'#8B6F8F','Fault Gouge':'#6E5A4A','Mixed Ground':'#9B8A6E',
  'Sandstone':'#C98B4A','Siltstone':'#B98C5C','Claystone':'#8B6F8F','Silty Clay':'#9A7560','Unclassified':'#4A5568'
};
const hazardColors = {low:'#5FA864', moderate:'#D9B23C', high:'#D6543F'};

const Tip = ({ text }) => (
  <span className="info-ic">
    ?
    <span className="tip">{text}</span>
  </span>
);

const ConfidenceRing = ({ pct, col }) => {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pctVal = pct !== null && pct !== undefined ? pct : 0;
  const offset = c - (pctVal / 100) * c;
  return (
    <svg width="74" height="74" viewBox="0 0 74 74" style={{ flexShrink: 0 }}>
      <circle cx="37" cy="37" r={r} fill="none" stroke="#262D36" strokeWidth="7" />
      <circle 
        cx="37" 
        cy="37" 
        r={r} 
        fill="none" 
        stroke={pct !== null ? col : '#262D36'} 
        strokeWidth="7" 
        strokeLinecap="round"
        strokeDasharray={c} 
        strokeDashoffset={offset} 
        transform="rotate(-90 37 37)"
      />
      <text x="37" y="41" textAnchor="middle" fill="#E7EAEE" fontFamily="IBM Plex Mono" fontSize="13" fontWeight="600">
        {pct !== null ? `${pct}%` : 'N/A'}
      </text>
    </svg>
  );
};

const QualityBar = ({ label, stats, maxVal = 100, col }) => {
  if (!stats || stats.mean === null || stats.mean === undefined) return null;
  const sMean = stats.mean;
  const sMin = stats.min !== null && stats.min !== undefined ? stats.min : sMean;
  const sMax = stats.max !== null && stats.max !== undefined ? stats.max : sMean;
  const pctMean = (sMean / maxVal) * 100;
  const pctMin = (sMin / maxVal) * 100;
  const pctMax = (sMax / maxVal) * 100;
  return (
    <div className="metric" style={{ marginBottom: '12px' }}>
      <div className="metric-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <span>{label}</span>
        <span style={{ fontSize: '10.2px', color: 'var(--text-dim)' }}>
          min: {sMin} | max: {sMax}
        </span>
      </div>
      <div className="metric-value" style={{ color: col, margin: '2px 0', fontSize: '18px' }}>{sMean}</div>
      <div className="metric-bar" style={{ position: 'relative', overflow: 'visible', height: '6px' }}>
        <div style={{ 
          position: 'absolute', 
          left: `${pctMin}%`, 
          width: `${pctMax - pctMin}%`, 
          height: '100%', 
          backgroundColor: 'rgba(231,234,238,0.15)',
          borderRadius: '2px' 
        }}></div>
        <div style={{ width: `${pctMean}%`, backgroundColor: col, height: '100%', borderRadius: '2px' }}></div>
      </div>
    </div>
  );
};

const QQualityBar = ({ label, stats }) => {
  if (!stats || stats.mean === null || stats.mean === undefined) return null;
  const sMean = stats.mean;
  const sMin = stats.min !== null && stats.min !== undefined ? stats.min : sMean;
  const sMax = stats.max !== null && stats.max !== undefined ? stats.max : sMean;
  return (
    <div className="metric" style={{ marginBottom: '12px' }}>
      <div className="metric-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <span>{label}</span>
        <span style={{ fontSize: '10.2px', color: 'var(--text-dim)' }}>
          min: {sMin.toFixed(2)} | max: {sMax.toFixed(2)}
        </span>
      </div>
      <div className="metric-value" style={{ color: 'var(--teal)', margin: '2px 0', fontSize: '18px' }}>{sMean.toFixed(2)}</div>
      <div className="metric-bar" style={{ height: '6px' }}>
        <div style={{ 
          width: `${Math.min(Math.log10(sMean + 1) * 33, 100)}%`, 
          backgroundColor: 'var(--teal)', 
          height: '100%',
          borderRadius: '2px'
        }}></div>
      </div>
    </div>
  );
};

const RmrBreakdownBar = ({ label, val, maxVal }) => {
  const pct = (val / maxVal) * 100;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{val} / {maxVal}</span>
      </div>
      <div style={{ height: '5px', backgroundColor: '#1A202C', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--amber)' }}></div>
      </div>
    </div>
  );
};

const JointCard = ({ name, joint }) => {
  if (!joint || joint.dip === null) return null;
  return (
    <div style={{ 
      background: 'var(--panel-2)', 
      border: '1px solid var(--line-soft)', 
      borderRadius: '6px', 
      padding: '10px',
      marginBottom: '10px'
    }}>
      <div style={{ 
        fontSize: '11px', 
        fontWeight: '600', 
        color: 'var(--text)', 
        borderBottom: '1px solid var(--line-soft)',
        paddingBottom: '4px',
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{name} Set</span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'normal' }}>
          {joint.dip}° / {joint.dipDir}°
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10.5px' }}>
        <div><span style={{ color: 'var(--text-dim)' }}>Strike:</span> <b style={{ color: 'var(--text)' }}>{joint.strike}°</b></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Spacing:</span> <b style={{ color: 'var(--text)' }}>{joint.spacing} cm</b></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Persistence:</span> <b style={{ color: 'var(--text)' }}>{joint.persistence} m</b></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Aperture:</span> <b style={{ color: 'var(--text)' }}>{joint.aperture} mm</b></div>
        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-dim)' }}>Roughness:</span> <b style={{ color: 'var(--text)', fontSize: '10px' }}>{joint.roughness}</b>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-dim)' }}>Infill:</span> <b style={{ color: 'var(--text)', fontSize: '10px' }}>{joint.infill}</b>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-dim)' }}>Weathering:</span> <b style={{ color: 'var(--text)', fontSize: '10px' }}>{joint.weathering}</b>
        </div>
      </div>
    </div>
  );
};

export default function RightPanel({
  segments,
  currentSegIdx,
  activeProject,
  supportMatrix,
  recommendationCategories,
  onBackToOverview,
  totalMeters,
  excavatedMeters
}) {
  const TOTAL = totalMeters;
  const FACE_CH = excavatedMeters;
  const [expandedAccordions, setExpandedAccordions] = useState({});

  const toggleAccordion = (id) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatCh = (m) => {
    const km = Math.floor(m / 1000);
    const rem = Math.round(m % 1000).toString().padStart(3, '0');
    return `${km}+${rem}`;
  };

  // Compute Project Overview summary statistics using selectors
  const summary = useMemo(() => {
    if (!segments || segments.length === 0) return null;

    let lowLength = 0;
    let moderateLength = 0;
    let highLength = 0;
    const groundLengths = {};
    let totalConfidenceLength = 0;
    let totalRmrLength = 0;
    let totalRmrWeight = 0;
    let totalGsiLength = 0;
    let totalGsiWeight = 0;
    let totalRqdLength = 0;
    let totalRqdWeight = 0;
    const highHazardZones = [];

    segments.forEach(s => {
      const len = s.endChainage - s.startChainage;
      if (s.hazard === 'low') lowLength += len;
      else if (s.hazard === 'moderate') moderateLength += len;
      else if (s.hazard === 'high') highLength += len;

      groundLengths[s.lithology] = (groundLengths[s.lithology] || 0) + len;
      totalConfidenceLength += s.confidence * len;
      
      if (s.rmr.mean !== null) {
        totalRmrLength += s.rmr.mean * len;
        totalRmrWeight += len;
      }
      if (s.gsi.mean !== null) {
        totalGsiLength += s.gsi.mean * len;
        totalGsiWeight += len;
      }
      if (s.rqd && s.rqd.mean !== null) {
        totalRqdLength += s.rqd.mean * len;
        totalRqdWeight += len;
      }

      if (s.hazard === 'high') {
        const lastZone = highHazardZones[highHazardZones.length - 1];
        if (lastZone && lastZone.end === s.startChainage) {
          lastZone.end = s.endChainage;
          if (!lastZone.grounds.includes(s.lithology)) lastZone.grounds.push(s.lithology);
        } else {
          highHazardZones.push({ start: s.startChainage, end: s.endChainage, grounds: [s.lithology] });
        }
      }
    });

    const avgConfidence = Math.round(totalConfidenceLength / TOTAL);
    const avgRmr = totalRmrWeight > 0 ? Math.round(totalRmrLength / totalRmrWeight) : "N/A";
    const avgGsi = totalGsiWeight > 0 ? Math.round(totalGsiLength / totalGsiWeight) : "N/A";
    const avgRqd = totalRqdWeight > 0 ? Math.round(totalRqdLength / totalRqdWeight) : "N/A";
    const lowPct = Math.round((lowLength / TOTAL) * 100);
    const modPct = Math.round((moderateLength / TOTAL) * 100);
    const highPct = Math.round((highLength / TOTAL) * 100);

    let dominantGround = '';
    let maxLen = 0;
    for (const [g, len] of Object.entries(groundLengths)) {
      if (len > maxLen) {
        maxLen = len;
        dominantGround = g;
      }
    }
    const dominantGroundPct = Math.round((maxLen / TOTAL) * 100);

    const zoneStrings = highHazardZones.map(z => `CH ${formatCh(z.start)}–${formatCh(z.end)} (${z.grounds.join('/')})`);
    const hazardZonesText = zoneStrings.length > 0
      ? `High-hazard intervals are predicted at ${zoneStrings.join(', ')}.`
      : `No high-hazard zones are predicted along the alignment.`;

    const text = `The <b>${activeProject}</b> spans a total length of <b>${TOTAL.toLocaleString()}m</b>, with <b>${FACE_CH.toLocaleString()}m</b> currently excavated. The tunnel alignment traverses variable geology, dominated by <b>${dominantGround}</b> (${dominantGroundPct}% of total length).
    Overall, <b>${lowPct}%</b> of the alignment is classified as low-hazard (stable ground), <b>${modPct}%</b> as moderate-hazard, and <b>${highPct}%</b> as high-hazard.
    ${hazardZonesText}
    The model forecasts squeezing ground behavior and potential water ingress in these faulted and sheared zones. The average prediction confidence across the entire tunnel is <b>${avgConfidence}%</b>, with higher certainty in the excavated sections.`;

    return {
      text,
      avgConfidence,
      avgRmr,
      avgGsi,
      avgRqd,
      lowPct,
      modPct,
      highPct,
      groundLengths
    };
  }, [segments, activeProject, TOTAL, FACE_CH]);

  if (!segments || segments.length === 0) {
    return (
      <div className="rightpanel">
        <div style={{ padding: '20px', color: 'var(--text-dim)', textAlign: 'center' }}>
          Loading Strata dashboard datasets...
        </div>
      </div>
    );
  }

  if (currentSegIdx === null) {
    // ==========================================
    // RENDER PROJECT OVERVIEW
    // ==========================================
    const s = summary;
    const sortedGrounds = Object.entries(s.groundLengths).sort((a, b) => b[1] - a[1]);

    return (
      <div className="rightpanel rp-fade" id="rightPanel">
        <div className="rp-header">
          <div className="rp-chainage">PROJECT OVERVIEW</div>
          <div className="rp-meta">
            <span className="hazard-badge low" style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(79,166,160,.2)' }}>
              Active Project
            </span>
            <span className="conf-inline" style={{ fontWeight: 500 }}>{activeProject}</span>
          </div>
        </div>
        
        <div className="plain-summary" style={{ marginTop: '14px' }} dangerouslySetInnerHTML={{ __html: s.text }} />

        <div className="rp-section">
          <div className="rp-section-title">Dominant Ground Types</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sortedGrounds.map(([g, len]) => {
              const pct = Math.round((len / TOTAL) * 100);
              return (
                <div className="prob-row" style={{ marginBottom: '8px' }} key={g}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text)' }}>
                    <span className="sw" style={{ backgroundColor: groundColors[g] || '#888', width: '8px', height: '8px', borderRadius: '2px', display: 'inline-block' }}></span>
                    <b>{g}</b>
                  </span>
                  <span style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                    {len}m ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rp-section">
          <div className="rp-section-title">Project Metrics</div>
          <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="metric">
              <div className="metric-label">
                Avg RMR <Tip text="Average Rock Mass Rating calculated across the alignment." />
              </div>
              <div className="metric-value amber">{s.avgRmr}</div>
            </div>
            <div className="metric">
              <div className="metric-label">
                Avg GSI <Tip text="Average Geological Strength Index calculated across the alignment." />
              </div>
              <div className="metric-value teal">{s.avgGsi}</div>
            </div>
            <div className="metric">
              <div className="metric-label">
                Avg RQD <Tip text="Average Rock Quality Designation (RQD) percentage." />
              </div>
              <div className="metric-value green" style={{ color: 'var(--green)' }}>{s.avgRqd}%</div>
            </div>
            <div className="metric" style={{ gridColumn: 'span 3' }}>
              <div className="metric-label">
                Excavation Progress <Tip text="Length of the tunnel excavated so far compared to the total design length." />
              </div>
              <div className="metric-value" style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '4px 0' }}>
                <span>{FACE_CH.toLocaleString()}m / {TOTAL.toLocaleString()}m</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  {Math.round((FACE_CH / TOTAL) * 100)}% Complete
                </span>
              </div>
              <div className="metric-bar">
                <div style={{ width: `${(FACE_CH / TOTAL) * 100}%`, backgroundColor: 'var(--green)', height: '100%', borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rp-section">
          <div className="rp-section-title">Overall Hazard Distribution</div>
          <div className="prob-row">
            <span className="prob-label">
              Low Hazard <Tip text="Stable ground conditions needing minimal reinforcement." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.lowPct}%`, backgroundColor: 'var(--green)' }}></div>
            </div>
            <span className="prob-val">{s.lowPct}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              Mod Hazard <Tip text="Fair rock mass requiring active monitoring and joint support." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.modPct}%`, backgroundColor: 'var(--yellow)' }}></div>
            </div>
            <span className="prob-val">{s.modPct}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              High Hazard <Tip text="Fault shear zones requiring immediate heavy reinforcement." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.highPct}%`, backgroundColor: 'var(--red)' }}></div>
            </div>
            <span className="prob-val">{s.highPct}%</span>
          </div>
        </div>

        <div className="rp-section">
          <div className="rp-section-title">Key Project Recommendations</div>
          <div className="rec-card" style={{ borderColor: 'var(--amber-dim)', background: 'linear-gradient(180deg,rgba(224,145,63,.07),rgba(224,145,63,.02))' }}>
            <ul className="rec-list">
              <li>Advance probe drilling <b style={{ color: 'var(--text)' }}>required</b> from CH 4+650 to 5+100</li>
              <li>Heavier lining support (Class B3/C2) <b style={{ color: 'var(--text)' }}>critical</b> for 24% of alignment</li>
              <li>Systematic drainage &amp; pre-grouting <b style={{ color: 'var(--text)' }}>recommended</b> in fault zones</li>
              <li>Infill borehole density <b style={{ color: 'var(--text)' }}>low</b> beyond CH 6+800</li>
            </ul>
          </div>
        </div>

        <div className="rp-section">
          <div className="rp-section-title">Project Geological Insights</div>
          <div className="comment-box">
            "The alignment crosses multiple lithological boundaries and two major active fault shear zones (Phyllite and Fault Gouge cores) which represent the primary geotechnical risks. Extreme care must be taken in squeezing ground zones between CH 1+080 – 1+620 and CH 4+650 – 5+100."
          </div>
        </div>

        <div className="rp-section" style={{ borderBottom: 'none' }}>
          <div className="rp-section-title">Overall Model Confidence</div>
          <div className="confidence-ring-row">
            <ConfidenceRing pct={s.avgConfidence} col="var(--teal)" />
            <div className="conf-detail">
              <div className="conf-detail-row"><span>Excavated Zone</span><b>88%</b></div>
              <div className="conf-detail-row"><span>Forecast Zone</span><b>64%</b></div>
              <div className="conf-detail-row"><span>Model Version</span><b>v4.1.2-aligned</b></div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // ==========================================
    // RENDER SEGMENT INSPECTION
    // ==========================================
    const s = segments[currentSegIdx];
    const isAhead = s.startChainage >= FACE_CH;
    const hazardLabel = s.hazard ? (s.hazard.charAt(0).toUpperCase() + s.hazard.slice(1)) : 'Unknown';
    const col = hazardColors[s.hazard] || '#888';

    // Safely extract nested structures with defaults
    const geologicalConditions = s.geologicalConditions || {};
    const rockBehaviour = s.rockBehaviour || {};
    const supportSystem = s.supportSystem || {};
    const rmrBreakdown = s.rmrBreakdown || {};
    const jointSets = s.jointSets || {};
    const aggregationMetadata = s.aggregationMetadata || { rowCount: 1, completeness: 1.0, missingFields: [] };

    // Build plainSummary card text
    let plainIcon = '🟢';
    let plainVerdict = <span>This section is <b>low risk</b>. </span>;
    if (s.hazard === 'moderate') {
      plainIcon = '🟡';
      plainVerdict = <span>This section needs <b>extra caution</b>. </span>;
    } else if (s.hazard === 'high') {
      plainIcon = '🔴';
      plainVerdict = <span>This section is <b>high risk</b>. </span>;
    }

    return (
      <div className="rightpanel rp-fade" id="rightPanel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
        {/* Header & Spatial Context */}
        <div className="rp-header">
          <div className="rp-head-row">
            <div className="rp-chainage" style={{ fontSize: '16px' }}>
              CH {formatCh(s.startChainage)}<span className="sep">—</span>CH {formatCh(s.endChainage)}
            </div>
            <button className="header-btn" id="backToOverviewBtn" onClick={onBackToOverview}>
              ← Overview
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', fontWeight: 500, fontFamily: 'var(--mono)' }}>
            Length: {Math.round(s.length)} m
          </div>
        </div>

        {/* 1. Geological Summary */}
        <div className="plain-summary" style={{ marginTop: '12px' }}>
          <span className="plain-icon">{plainIcon}</span>
          {plainVerdict}
          <span>{s.summary}</span>
        </div>

        {/* 2. Hazard & Confidence */}
        <div className="rp-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--panel-2)', borderRadius: '6px', margin: '12px 14px 4px 14px', border: '1px solid var(--line-soft)' }}>
          <span className={`hazard-badge ${s.hazard}`} style={{ margin: 0 }}>{hazardLabel} Hazard</span>
          <span className="conf-inline" style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 500 }}>
            {isAhead ? 'Forecast' : 'Observed'} · Confidence <b>{s.confidence}%</b>
          </span>
        </div>

        {/* 3. Geological Conditions */}
        <div className="rp-section">
          <div className="rp-section-title">Geological Conditions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: 'var(--panel-2)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line-soft)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Lithology</div>
              <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className="sw" style={{ backgroundColor: groundColors[s.lithology] || '#888', width: '6px', height: '6px', borderRadius: '50%' }}></span>
                {s.lithology}
              </div>
            </div>
            <div style={{ background: 'var(--panel-2)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line-soft)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Rock Strength</div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', color: 'var(--text)' }}>
                {geologicalConditions.rockStrength || 'N/A'}
              </div>
            </div>
            <div style={{ background: 'var(--panel-2)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line-soft)', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Geological Formation</div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, marginTop: '2px', color: 'var(--text)' }}>
                {geologicalConditions.formation || 'N/A'}
              </div>
            </div>
            <div style={{ background: 'var(--panel-2)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line-soft)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Weathering Grade</div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, marginTop: '2px', color: 'var(--text-dim)' }}>
                {geologicalConditions.weatheringGrade || 'N/A'}
              </div>
            </div>
            <div style={{ background: 'var(--panel-2)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line-soft)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Groundwater / Seepage</div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, marginTop: '2px', color: s.groundwater === 'Wet' ? 'var(--blue)' : 'var(--text)' }}>
                {geologicalConditions.groundwaterClass || 'N/A'} ({geologicalConditions.seepage || 'N/A'})
              </div>
            </div>
          </div>
        </div>

        {/* 4. Rock Quality */}
        <div className="rp-section">
          <div className="rp-section-title">Rock Quality Indices</div>
          <div className="metric-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <QualityBar label="RMR (Rock Mass Rating)" stats={s.rmr} col="var(--amber)" />
            <QualityBar label="GSI (Geological Strength Index)" stats={s.gsi} col="var(--teal)" />
            <QualityBar label="RQD (Rock Quality Designation)" stats={s.rqd} col="var(--green)" />
            <QQualityBar label="Q-System Rating" stats={s.qSystem} />
          </div>
        </div>

        {/* 5. Rock Behaviour */}
        <div className="rp-section">
          <div className="rp-section-title">Rock Mass Behaviour</div>
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--line-soft)', padding: '10px', borderRadius: '6px' }}>
            <div className="prob-row" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Failure Modes:</span>
              <span style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--text)' }}>{rockBehaviour.failureModes || 'N/A'}</span>
            </div>
            <div className="prob-row" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Face Stability:</span>
              <span style={{ fontWeight: 600, fontSize: '11.5px', color: (rockBehaviour.faceStability && rockBehaviour.faceStability.toLowerCase().includes('unstable')) ? 'var(--red)' : 'var(--green)' }}>
                {rockBehaviour.faceStability || 'Stable'}
              </span>
            </div>
            <div className="prob-row" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Deformation Limit:</span>
              <span style={{ fontWeight: 600, fontSize: '11.5px', fontFamily: 'var(--mono)' }}>{rockBehaviour.deformationTolerance || '50'} mm</span>
            </div>
            <div className="prob-row" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Discontinuity Sets:</span>
              <span style={{ fontWeight: 600, fontSize: '11.5px' }}>{rockBehaviour.numberJointSets || '3'} Prominent Sets</span>
            </div>
            {rockBehaviour.behaviourFlags && rockBehaviour.behaviourFlags.length > 0 && (
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--line-soft)', paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px' }}>Active Geotechnical Flags:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {rockBehaviour.behaviourFlags.map(f => (
                    <span key={f} style={{ background: 'rgba(214,84,63,.15)', color: 'var(--red)', fontSize: '9.5px', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                      ⚠ {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Support System */}
        <div className="rp-section">
          <div className="rp-section-title">Support System Specification</div>
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--line-soft)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--line-soft)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Design Support Class</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--amber)' }}>Class {supportSystem.supportClass || 'N/A'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>ML Forecast Class</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal)' }}>
                  Class {supportSystem.predictedSupportClass || 'N/A'}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div className="prob-row">
                <span style={{ color: 'var(--text-dim)' }}>Shotcrete Lining:</span>
                <b style={{ color: 'var(--text)' }}>{supportSystem.shotcreteThickness || 'N/A'}</b>
              </div>
              <div className="prob-row">
                <span style={{ color: 'var(--text-dim)' }}>Rockbolts:</span>
                <b style={{ color: 'var(--text)' }}>{supportSystem.rockboltType || 'N/A'} ({supportSystem.rockboltLength || 'N/A'}) @ {supportSystem.rockboltSpacing || 'N/A'}</b>
              </div>
              <div className="prob-row">
                <span style={{ color: 'var(--text-dim)' }}>Lattice Girders:</span>
                <b style={{ color: 'var(--text)' }}>{supportSystem.latticeGirder || 'N/A'}</b>
              </div>
              <div className="prob-row">
                <span style={{ color: 'var(--text-dim)' }}>Steel Ribs Type:</span>
                <b style={{ color: 'var(--text)' }}>{supportSystem.steelRibs || 'N/A'}</b>
              </div>
              <div className="prob-row">
                <span style={{ color: 'var(--text-dim)' }}>Face Support:</span>
                <b style={{ color: 'var(--text)' }}>{supportSystem.faceSupport || 'N/A'}</b>
              </div>
              <div className="prob-row">
                <span style={{ color: 'var(--text-dim)' }}>Crown Spiles / Forepoling:</span>
                <b style={{ color: 'var(--text)', fontSize: '10px', maxWidth: '200px', textAlign: 'right' }}>{supportSystem.crownSupport || 'N/A'}</b>
              </div>
              <div className="prob-row" style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: '6px', marginTop: '2px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Permanent Lining:</span>
                <b style={{ color: 'var(--text)' }}>{supportSystem.finalLining || 'N/A'}</b>
              </div>
            </div>
          </div>
        </div>

        {/* 7. RMR Rating Breakdown Accordion */}
        <div className="rp-section">
          <div className="rec-accordion">
            <div className={`rec-accordion-item ${expandedAccordions['rmr-breakdown'] ? 'active' : ''}`}>
              <div className="rec-accordion-header" onClick={() => toggleAccordion('rmr-breakdown')}>
                <div className="rec-accordion-title">
                  <span className="rec-accordion-toggle-icon">▶</span>
                  <span>RMR Rating Breakdown</span>
                </div>
              </div>
              <div className="rec-accordion-body">
                <div className="rec-accordion-content" style={{ background: 'var(--panel-2)', padding: '10px', borderRadius: '4px' }}>
                  <RmrBreakdownBar label="UCS / Intact Rock Strength" val={rmrBreakdown.strength || 0} maxVal={15} />
                  <RmrBreakdownBar label="RQD Value rating" val={rmrBreakdown.rqd || 0} maxVal={20} />
                  <RmrBreakdownBar label="Discontinuity Spacing rating" val={rmrBreakdown.spacing || 0} maxVal={20} />
                  <RmrBreakdownBar label="Discontinuity Condition rating" val={rmrBreakdown.condition || 0} maxVal={30} />
                  <RmrBreakdownBar label="Groundwater Inflow rating" val={rmrBreakdown.groundwater || 0} maxVal={15} />
                  <RmrBreakdownBar label="Joint Orientation Adjustment" val={rmrBreakdown.adjustment || 0} maxVal={0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Structural Discontinuities Accordion */}
        <div className="rp-section">
          <div className="rec-accordion">
            <div className={`rec-accordion-item ${expandedAccordions['structural-joints'] ? 'active' : ''}`}>
              <div className="rec-accordion-header" onClick={() => toggleAccordion('structural-joints')}>
                <div className="rec-accordion-title">
                  <span className="rec-accordion-toggle-icon">▶</span>
                  <span>Discontinuities &amp; Joint Sets</span>
                </div>
              </div>
              <div className="rec-accordion-body">
                <div className="rec-accordion-content" style={{ padding: '4px 0' }}>
                  <JointCard name="J1" joint={jointSets.J1} />
                  <JointCard name="J2" joint={jointSets.J2} />
                  <JointCard name="J3" joint={jointSets.J3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 9. Engineer Notes */}
        <div className="rp-section">
          <div className="rp-section-title">Geologist Logging Notes</div>
          <div className="comment-box" style={{ fontSize: '11px', lineHeight: '1.45' }}>
            "{s.engineerNotes ? s.engineerNotes : 'No special geological logging remarks recorded for this section.'}"
          </div>
        </div>

        {/* 10. Engineering Interpretation (Explainable AI) */}
        <div className="rp-section">
          <div className="rp-section-title">Explainable AI Core</div>
          <div className="rec-card" style={{ borderColor: 'var(--teal-dim)', background: 'linear-gradient(180deg,rgba(79,166,160,.06),rgba(79,166,160,.01))' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--teal)', marginBottom: '4px' }}>Engineering Interpretation</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              "This section will provide AI-generated geological interpretation and engineering reasoning based on the observed data."
            </div>
          </div>
        </div>

        {/* 11. Aggregation Data Quality metadata */}
        <div className="rp-section" style={{ borderBottom: 'none', background: 'var(--panel-2)', margin: '14px 14px 10px 14px', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line-soft)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: '6px' }}>
            Aggregation Diagnostics
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
            <div className="prob-row">
              <span>Observations Merged:</span>
              <b>{aggregationMetadata.rowCount || 1} log sheets</b>
            </div>
            <div className="prob-row">
              <span>Data Completeness:</span>
              <b>{Math.round((aggregationMetadata.completeness || 1.0) * 100)}%</b>
            </div>
            {aggregationMetadata.missingFields && aggregationMetadata.missingFields.length > 0 && (
              <div style={{ marginTop: '4px', color: 'var(--text-dim)' }}>
                <span>Missing: </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', background: 'var(--panel-1)', padding: '1px 4px', borderRadius: '2px' }}>
                  {aggregationMetadata.missingFields.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
