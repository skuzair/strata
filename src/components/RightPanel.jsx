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
    <div className="metric" style={{ marginBottom: '10px', padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 600, color: col }}>{sMean}</span>
      </div>
      <div className="metric-bar" style={{ position: 'relative', overflow: 'visible', height: '6px', backgroundColor: 'var(--bg)', borderRadius: '3px', marginBottom: '4px' }}>
        <div style={{ 
          position: 'absolute', 
          left: `${pctMin}%`, 
          width: `${pctMax - pctMin}%`, 
          height: '100%', 
          backgroundColor: 'rgba(231,234,238,0.12)',
          borderRadius: '3px' 
        }}></div>
        <div style={{ width: `${pctMean}%`, backgroundColor: col, height: '100%', borderRadius: '3px' }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9.5px', color: 'var(--text-faint)', fontFamily: 'var(--mono)' }}>
        min: {sMin} | max: {sMax}
      </div>
    </div>
  );
};

const QQualityBar = ({ label, stats }) => {
  if (!stats || stats.mean === null || stats.mean === undefined) return null;
  const sMean = stats.mean;
  const sMin = stats.min !== null && stats.min !== undefined ? stats.min : sMean;
  const sMax = stats.max !== null && stats.max !== undefined ? stats.max : sMean;
  
  const logPct = (val) => {
    const minQ = 0.001;
    const maxQ = 1000.0;
    const logMin = Math.log10(minQ);
    const logMax = Math.log10(maxQ);
    const lVal = Math.log10(Math.max(val, minQ));
    return Math.min(Math.max(((lVal - logMin) / (logMax - logMin)) * 100, 0), 100);
  };
  
  const pctMean = logPct(sMean);
  const pctMin = logPct(sMin);
  const pctMax = logPct(sMax);
  
  return (
    <div className="metric" style={{ marginBottom: '10px', padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 600, color: 'var(--teal)' }}>{sMean.toFixed(2)}</span>
      </div>
      <div className="metric-bar" style={{ position: 'relative', overflow: 'visible', height: '6px', backgroundColor: 'var(--bg)', borderRadius: '3px', marginBottom: '4px' }}>
        <div style={{ 
          position: 'absolute', 
          left: `${pctMin}%`, 
          width: `${pctMax - pctMin}%`, 
          height: '100%', 
          backgroundColor: 'rgba(231,234,238,0.12)',
          borderRadius: '3px' 
        }}></div>
        <div style={{ width: `${pctMean}%`, backgroundColor: 'var(--teal)', height: '100%', borderRadius: '3px' }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9.5px', color: 'var(--text-faint)', fontFamily: 'var(--mono)' }}>
        min: {sMin.toFixed(2)} | max: {sMax.toFixed(2)}
      </div>
    </div>
  );
};

const RmrBreakdownBar = ({ label, val, maxVal }) => {
  const pct = (val / maxVal) * 100;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: 500 }}>{val} / {maxVal}</span>
      </div>
      <div style={{ height: '5px', backgroundColor: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--amber)', borderRadius: '3px' }}></div>
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
      padding: '12px',
      marginBottom: '10px'
    }}>
      <div style={{ 
        fontSize: '11px', 
        fontWeight: '600', 
        color: 'var(--text)', 
        borderBottom: '1px solid var(--line-soft)',
        paddingBottom: '6px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{name} Set</span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'normal', fontFamily: 'var(--mono)' }}>
          {joint.dip}° / {joint.dipDir}°
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '3px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Strike:</span>
          <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{joint.strike}°</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '3px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Spacing:</span>
          <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{joint.spacing} cm</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '3px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Persistence:</span>
          <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{joint.persistence} m</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '3px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Aperture:</span>
          <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{joint.aperture} mm</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '3px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Roughness:</span>
          <b style={{ color: 'var(--text)', fontSize: '10.5px' }}>{joint.roughness}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '3px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Infill:</span>
          <b style={{ color: 'var(--text)', fontSize: '10.5px' }}>{joint.infill}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-dim)' }}>Weathering:</span>
          <b style={{ color: 'var(--text)', fontSize: '10.5px' }}>{joint.weathering}</b>
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
            <ul className="rec-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Advance Probe Drilling</span>
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--mono)', background: 'var(--amber-dim)', color: 'var(--amber)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>REQUIRED</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                  Mandatory forward probe drilling from <span style={{ fontFamily: 'var(--mono)' }}>CH 4+650</span> to <span style={{ fontFamily: 'var(--mono)' }}>5+100</span>.
                </div>
              </li>
              <li style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Lining Support Upgrade</span>
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--mono)', background: 'rgba(214,84,63,.15)', color: 'var(--red)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>CRITICAL</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                  Heavier lining support (Class B3/C2) is critical for 24% of the alignment length.
                </div>
              </li>
              <li style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Drainage &amp; Pre-Grouting</span>
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--mono)', background: 'rgba(79,166,160,.15)', color: 'var(--teal)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>RECOMMENDED</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                  Systematic water control measures recommended through all mapped fault shear zones.
                </div>
              </li>
              <li style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Infill Borehole Density</span>
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--mono)', background: 'var(--panel)', color: 'var(--text-dim)', padding: '1px 6px', borderRadius: '3px', border: '1px solid var(--line-soft)', fontWeight: 600 }}>LOW</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                  Geotechnical confidence is limited beyond <span style={{ fontFamily: 'var(--mono)' }}>CH 6+800</span> due to sparse borehole logs.
                </div>
              </li>
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
          <span dangerouslySetInnerHTML={{
            __html: s.summary
              .replace(/(RMR\s*\d+)/gi, '<strong style="color: var(--amber); font-weight: 600;">$1</strong>')
              .replace(/(GSI\s*\d+)/gi, '<strong style="color: var(--teal); font-weight: 600;">$1</strong>')
              .replace(/(Class\s+[A-Za-z0-9\-\/]+)/g, '<strong style="color: var(--amber); font-weight: 600;">$1</strong>')
              .replace(/(Gneiss|Schist|Quartzite|Granite|Silicified|Lithology|Wet|Damp|Dry|Portal)/gi, '<strong style="color: var(--text); font-weight: 600;">$1</strong>')
              .replace(/(Support Class)/gi, '<strong style="color: var(--text); font-weight: 600;">$1</strong>')
              .replace(/(Hazard)/gi, '<strong style="color: var(--text); font-weight: 600;">$1</strong>')
          }} />
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="geo-cond-card">
              <div className="geo-cond-label">Lithology</div>
              <div className="geo-cond-value">
                <span className="sw" style={{ backgroundColor: groundColors[s.lithology] || '#888', width: '6px', height: '6px', borderRadius: '50%' }}></span>
                {s.lithology}
              </div>
            </div>
            <div className="geo-cond-card">
              <div className="geo-cond-label">Rock Strength</div>
              <div className="geo-cond-value">{geologicalConditions.rockStrength || 'N/A'}</div>
            </div>
            <div className="geo-cond-card" style={{ gridColumn: 'span 2' }}>
              <div className="geo-cond-label">Geological Formation</div>
              <div className="geo-cond-value">{geologicalConditions.formation || 'N/A'}</div>
            </div>
            <div className="geo-cond-card">
              <div className="geo-cond-label">Weathering Grade</div>
              <div className="geo-cond-value">{geologicalConditions.weatheringGrade || 'N/A'}</div>
            </div>
            <div className="geo-cond-card">
              <div className="geo-cond-label">Groundwater &amp; Seepage</div>
              <div className="geo-cond-value" style={{ color: s.groundwater === 'Wet' ? 'var(--red)' : 'var(--text)' }}>
                {geologicalConditions.groundwaterClass || 'N/A'} ({geologicalConditions.seepage || 'N/A'})
              </div>
            </div>
          </div>
        </div>

        {/* 4. Rock Quality */}
        <div className="rp-section">
          <div className="rp-section-title">Rock Quality Indices</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <QualityBar label="RMR (Rock Mass Rating)" stats={s.rmr} col="var(--amber)" />
            <QualityBar label="GSI (Geological Strength Index)" stats={s.gsi} col="var(--teal)" />
            <QualityBar label="RQD (Rock Quality Designation)" stats={s.rqd} col="var(--green)" />
            <QQualityBar label="Q-System Rating" stats={s.qSystem} />
          </div>
        </div>

        {/* 5. Rock Behaviour */}
        <div className="rp-section">
          <div className="rp-section-title">Rock Mass Behaviour</div>
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--line-soft)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Failure Modes:</span>
                <b style={{ color: 'var(--text)' }}>{rockBehaviour.failureModes || 'N/A'}</b>
              </div>
              <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Face Stability:</span>
                <b style={{ color: (rockBehaviour.faceStability && rockBehaviour.faceStability.toLowerCase().includes('unstable')) ? 'var(--red)' : 'var(--green)' }}>
                  {rockBehaviour.faceStability || 'Stable'}
                </b>
              </div>
              <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Deformation Limit:</span>
                <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{rockBehaviour.deformationTolerance || '50'} mm</b>
              </div>
              <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Discontinuity Sets:</span>
                <b style={{ color: 'var(--text)' }}>{rockBehaviour.numberJointSets || '3'} Prominent Sets</b>
              </div>
            </div>
            {rockBehaviour.behaviourFlags && rockBehaviour.behaviourFlags.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px dashed var(--line-soft)', paddingTop: '10px' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px', fontFamily: 'var(--mono)' }}>Active Geotechnical Flags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {rockBehaviour.behaviourFlags.map(f => (
                    <span key={f} className="warning-chip">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px' }}>
              {/* Core Design Class */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderBottom: '1px solid var(--line-soft)', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Design Support Class</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--amber)', marginTop: '2px' }}>Class {supportSystem.supportClass || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.05em' }}>ML Forecast Class</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--teal)', marginTop: '2px' }}>Class {supportSystem.predictedSupportClass || 'N/A'}</div>
                </div>
              </div>

              {/* Structural Reinforcement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '2px', fontFamily: 'var(--mono)' }}>Structural Reinforcement</div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Shotcrete Lining:</span>
                  <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{supportSystem.shotcreteThickness || 'N/A'}</b>
                </div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Rockbolts Type/Len:</span>
                  <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '11px' }}>{supportSystem.rockboltType || 'N/A'} ({supportSystem.rockboltLength || 'N/A'})</b>
                </div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Rockbolt Spacing:</span>
                  <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{supportSystem.rockboltSpacing || 'N/A'}</b>
                </div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Lattice Girders:</span>
                  <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '11px', maxWidth: '170px', textAlign: 'right' }}>{supportSystem.latticeGirder || 'N/A'}</b>
                </div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Steel Ribs Type:</span>
                  <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{supportSystem.steelRibs || 'N/A'}</b>
                </div>
              </div>

              {/* Execution / Spiling */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--line-soft)', paddingTop: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '2px', fontFamily: 'var(--mono)' }}>Execution / Excavation Support</div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Face Support:</span>
                  <b style={{ color: 'var(--text)' }}>{supportSystem.faceSupport || 'N/A'}</b>
                </div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Crown Spiles / Forepoling:</span>
                  <b style={{ color: 'var(--text)', fontSize: '11px', maxWidth: '170px', textAlign: 'right' }}>{supportSystem.crownSupport || 'N/A'}</b>
                </div>
              </div>

              {/* Final Lining */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--line-soft)', paddingTop: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '2px', fontFamily: 'var(--mono)' }}>Final Support</div>
                <div className="prob-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Permanent Lining:</span>
                  <b style={{ color: 'var(--text)' }}>{supportSystem.finalLining || 'N/A'}</b>
                </div>
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
