import React, { useState, useMemo } from 'react';

const groundColors = {
  'Hard Quartzite':'#C98B4A','Jointed Quartzite':'#B98C5C','Weathered Gneiss':'#A87A56',
  'Fractured Gneiss':'#9A7560','Sheared Phyllite':'#8B6F8F','Fault Gouge':'#6E5A4A','Mixed Ground':'#9B8A6E'
};
const hazardColors = {low:'#5FA864', moderate:'#D9B23C', high:'#D6543F'};
const TOTAL = 9800;
const FACE_CH = 4260;

// Inline Tooltip icon component helper
const Tip = ({ text }) => (
  <span className="info-ic">
    ?
    <span className="tip">{text}</span>
  </span>
);

// Inline Gauge Ring component
const ConfidenceRing = ({ pct, col }) => {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="74" height="74" viewBox="0 0 74 74" style={{ flexShrink: 0 }}>
      <circle cx="37" cy="37" r={r} fill="none" stroke="#262D36" strokeWidth="7" />
      <circle 
        cx="37" 
        cy="37" 
        r={r} 
        fill="none" 
        stroke={col} 
        strokeWidth="7" 
        strokeLinecap="round"
        strokeDasharray={c} 
        strokeDashoffset={offset} 
        transform="rotate(-90 37 37)"
      />
      <text x="37" y="41" textAnchor="middle" fill="#E7EAEE" fontFamily="IBM Plex Mono" fontSize="15" fontWeight="600">
        {pct}%
      </text>
    </svg>
  );
};

export default function RightPanel({
  segments,
  currentSegIdx,
  activeProject,
  supportMatrix,
  recommendationCategories,
  onBackToOverview
}) {
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
    let totalGsiLength = 0;
    const highHazardZones = [];

    segments.forEach(s => {
      const len = s.end - s.start;
      if (s.hazard === 'low') lowLength += len;
      else if (s.hazard === 'moderate') moderateLength += len;
      else if (s.hazard === 'high') highLength += len;

      groundLengths[s.ground] = (groundLengths[s.ground] || 0) + len;
      totalConfidenceLength += s.confidence * len;
      totalRmrLength += s.rmr * len;
      totalGsiLength += s.gsi * len;

      if (s.hazard === 'high') {
        const lastZone = highHazardZones[highHazardZones.length - 1];
        if (lastZone && lastZone.end === s.start) {
          lastZone.end = s.end;
          if (!lastZone.grounds.includes(s.ground)) lastZone.grounds.push(s.ground);
        } else {
          highHazardZones.push({ start: s.start, end: s.end, grounds: [s.ground] });
        }
      }
    });

    const avgConfidence = Math.round(totalConfidenceLength / TOTAL);
    const avgRmr = Math.round(totalRmrLength / TOTAL);
    const avgGsi = Math.round(totalGsiLength / TOTAL);
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
      lowPct,
      modPct,
      highPct,
      groundLengths
    };
  }, [segments, activeProject]);

  // If data is loading
  if (!segments || segments.length === 0) {
    return (
      <div className="rightpanel">
        <div style={{ padding: '20px', color: 'var(--text-dim)', textAlign: 'center' }}>
          Loading dashboard data...
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
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-label">
                Average RMR <Tip text="Average Rock Mass Rating calculated across the entire tunnel alignment." />
              </div>
              <div className="metric-value amber">{s.avgRmr}</div>
            </div>
            <div className="metric">
              <div className="metric-label">
                Average GSI <Tip text="Average Geological Strength Index calculated across the entire tunnel alignment." />
              </div>
              <div className="metric-value teal">{s.avgGsi}</div>
            </div>
            <div className="metric" style={{ gridColumn: 'span 2' }}>
              <div className="metric-label">
                Excavation Progress <Tip text="Length of the tunnel excavated so far compared to the total design length." />
              </div>
              <div className="metric-value" style={{ fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>{FACE_CH.toLocaleString()}m / {TOTAL.toLocaleString()}m</span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  {Math.round((FACE_CH / TOTAL) * 100)}% Complete
                </span>
              </div>
              <div className="metric-bar">
                <div style={{ width: `${(FACE_CH / TOTAL) * 100}%`, backgroundColor: 'var(--green)', height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rp-section">
          <div className="rp-section-title">Overall Hazard Distribution</div>
          <div className="prob-row">
            <span className="prob-label">
              Low Hazard <Tip text="Percentage of alignment with stable ground conditions needing minimal reinforcement." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.lowPct}%`, backgroundColor: 'var(--green)' }}></div>
            </div>
            <span className="prob-val">{s.lowPct}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              Mod Hazard <Tip text="Percentage of alignment with fair rock mass requiring active monitoring and joint support." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.modPct}%`, backgroundColor: 'var(--yellow)' }}></div>
            </div>
            <span className="prob-val">{s.modPct}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              High Hazard <Tip text="Percentage of alignment in highly weathered or shear fault zones requiring immediate heavy reinforcement." />
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
            <div className="rec-card-head">
              <span className="rec-card-title">Fault &amp; Shear Zone Action Plan</span>
            </div>
            <ul className="rec-list">
              <li>Advance probe drilling <b style={{ color: 'var(--text)' }}>required</b> from CH 4+650 to 5+100</li>
              <li>Heavier lining support (Class S4/S5) <b style={{ color: 'var(--text)' }}>critical</b> for 13% of alignment</li>
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
              <div className="conf-detail-row"><span>Model Version</span><b>v3.4.1</b></div>
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
    const isAhead = s.start >= FACE_CH;
    const hazardLabel = s.hazard.charAt(0).toUpperCase() + s.hazard.slice(1);
    const col = hazardColors[s.hazard];

    // Compute watch cards dynamically
    let watchHTML = null;
    if (s.hazardTypes && s.hazardTypes.length > 0) {
      watchHTML = (
        <div className="rec-card" style={{ borderColor: 'var(--red-dim)', background: 'linear-gradient(180deg,rgba(214,84,63,.08),rgba(214,84,63,.02))', marginTop: '10px' }}>
          <div className="rec-card-head">
            <span className="rec-card-title" style={{ color: 'var(--red)' }}>Hazard Watch</span>
          </div>
          <ul className="rec-list">
            {s.hazardTypes.map((h, i) => (
              <li key={i}>{h} <b style={{ color: 'var(--red)' }}>flagged</b></li>
            ))}
          </ul>
        </div>
      );
    }
    
    let recommendationHTML = null;
    if (isAhead && s.confidence < 65) {
      recommendationHTML = (
        <div className="rec-card" style={{ borderColor: 'var(--line)', background: 'var(--panel-2)', marginTop: '10px' }}>
          <div className="rec-card-head">
            <span className="rec-card-title" style={{ color: 'var(--text-dim)' }}>Data Recommendation</span>
          </div>
          <ul className="rec-list">
            <li>Advance probe drilling <b style={{ color: 'var(--text)' }}>suggested</b></li>
            <li>Infill borehole density <b style={{ color: 'var(--text)' }}>low</b></li>
          </ul>
        </div>
      );
    }

    // Build plainSummary card text
    let plainIcon = '🟢';
    let plainVerdict = <span>This section is <b>low risk</b>. </span>;
    let plainExtra = isAhead 
      ? "The model expects stable ground here - standard support should be enough when the face reaches this point."
      : "The rock encountered here has been stable, standard support is sufficient.";

    if (s.hazard === 'moderate') {
      plainIcon = '🟡';
      plainVerdict = <span>This section needs <b>extra caution</b>. </span>;
      plainExtra = isAhead
        ? "The model expects moderately weak or fractured ground here - heavier support and closer monitoring are recommended as excavation approaches."
        : "The rock here is moderately weak or fractured - heavier support has been used and monitoring is ongoing.";
    } else if (s.hazard === 'high') {
      plainIcon = '🔴';
      plainVerdict = <span>This section is <b>high risk</b>. </span>;
      plainExtra = isAhead
        ? "The model flags a real chance of unstable ground, a fault, or water problems here - advance investigation (probe drilling) and heavy support are recommended well before the face arrives."
        : "Unstable ground, a fault, and/or heavy water was encountered here - heavy reinforcement is in use and this zone needs close monitoring.";
    }

    // Accordion categories rendering
    const classData = supportMatrix ? (supportMatrix[s.supportClass] || {}) : {};

    return (
      <div className="rightpanel rp-fade" id="rightPanel">
        {/* Header */}
        <div className="rp-header">
          <div className="rp-head-row">
            <div className="rp-chainage">
              {formatCh(s.start)}<span className="sep">-</span>{formatCh(s.end)}
            </div>
            <button className="header-btn" id="backToOverviewBtn" onClick={onBackToOverview}>
              ← Overview
            </button>
          </div>
          <div className="rp-meta">
            <span className={`hazard-badge ${s.hazard}`}>{hazardLabel} Hazard</span>
            <span className="conf-inline">
              {isAhead ? 'Forecast' : 'Observed'}{' '}
              <Tip text="The tunnel face - the point currently being dug - has not reached this section yet if it says Forecast. That means this is a prediction, not a direct observation." />{' '}
              · Confidence {s.confidence}%{' '}
              <Tip text="How sure the model is about this prediction. Higher is more reliable. Sections far ahead of the tunnel face naturally have lower confidence." />
            </span>
          </div>
        </div>

        {/* AI Summary */}
        <div className="plain-summary">
          <span className="plain-icon">{plainIcon}</span>
          {plainVerdict}
          {plainExtra}
        </div>

        {/* Ground type */}
        <div className="rp-section">
          <div className="rp-section-title">Ground Type</div>
          <div className="ground-tag">
            <span className="sw" style={{ backgroundColor: groundColors[s.ground] }}></span>
            {s.ground}
          </div>
        </div>

        {/* Geotechnical Prediction Metrics */}
        <div className="rp-section">
          <div className="rp-section-title">Prediction Metrics</div>
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-label">
                RMR <Tip text="Rock Mass Rating, 0-100. Higher means stronger, more stable rock that needs less support." />
              </div>
              <div className="metric-value">{s.rmr}</div>
              <div className="metric-bar">
                <div style={{ width: `${s.rmr}%`, backgroundColor: col, height: '100%' }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">
                Q-System <Tip text="Another rock-quality score, from about 0.001 to 1000. Used together with RMR to plan support." />
              </div>
              <div className="metric-value">{s.q.toFixed(1)}</div>
              <div className="metric-bar">
                <div style={{ width: `${Math.min(s.q * 9, 100)}%`, backgroundColor: col, height: '100%' }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">
                GSI <Tip text="Geological Strength Index, 0-100. Lower means more fractured and weaker rock mass." />
              </div>
              <div className="metric-value">{s.gsi}</div>
              <div className="metric-bar">
                <div style={{ width: `${s.gsi}%`, backgroundColor: col, height: '100%' }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">
                Support Class <Tip text="Engineering support envelope from the richer recommendation model. A classes are lighter support; C classes are heavy support." />
              </div>
              <div className={`metric-value ${s.supportClass.startsWith('C') ? 'red' : s.supportClass.startsWith('A') ? 'teal' : 'amber'}`}>
                {s.supportClass}
              </div>
              <div className="metric-bar">
                <div style={{ width: `${s.recommendationConfidence.overall}%`, backgroundColor: 'var(--teal)', height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Probability estimates */}
        <div className="rp-section">
          <div className="rp-section-title">Probability Estimates</div>
          <div className="prob-row">
            <span className="prob-label">
              Fault zone <Tip text="Estimated chance a geological fault crosses this section. Faults are weak, unpredictable ground." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.probability.fault}%`, backgroundColor: s.probability.fault > 50 ? 'var(--red)' : 'var(--teal)' }}></div>
            </div>
            <span className="prob-val">{s.probability.fault}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              Water ingress <Tip text="Estimated chance of groundwater entering the tunnel here. Higher means more drainage or grouting risk." />
            </span>
            <div className="prob-track">
              <div className="prob-fill" style={{ width: `${s.probability.water}%`, backgroundColor: s.probability.water > 50 ? '#4F8FA6' : 'var(--teal)' }}></div>
            </div>
            <span className="prob-val">{s.probability.water}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              Behaviour <Tip text="Predicted engineering ground response expected during excavation." />
            </span>
            <div style={{ flex: 1, textAlign: 'right', fontSize: '11.5px', color: 'var(--text)', fontWeight: 500 }}>
              {s.probability.groundBehaviour}
            </div>
          </div>
          <div className="prob-row">
            <span className="prob-label">
              Deformation <Tip text="Predicted tunnel convergence or deformation expected in this section." />
            </span>
            <div style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '11.5px', color: 'var(--text)', fontWeight: 500 }}>
              {s.probability.tunnelDeformation}
            </div>
          </div>
        </div>

        {/* Support recommendations accordion panel */}
        <div className="rp-section">
          <div className="rp-section-title">Support Recommendations</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', background: 'var(--panel-2)', border: '1px solid var(--line-soft)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 500 }}>
              Recommendation Confidence
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <div className="prob-track" style={{ width: '70px', height: '5px', margin: 0 }}>
                <div className="prob-fill" style={{ width: `${s.recommendationConfidence.overall}%`, backgroundColor: 'var(--teal)' }}></div>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>
                {s.recommendationConfidence.overall}%
              </span>
            </div>
          </div>

          <div className="rec-accordion">
            {recommendationCategories && recommendationCategories.map(cat => {
              const fieldsHTML = Object.keys(cat.fields)
                .filter(fieldKey => classData[fieldKey] !== undefined && classData[fieldKey] !== null)
                .map(fieldKey => (
                  <li key={fieldKey}>
                    <span>{cat.fields[fieldKey]}</span>
                    <b>{classData[fieldKey]}</b>
                  </li>
                ));

              if (fieldsHTML.length === 0) return null;

              const fosVal = cat.fosKey ? s.supportFactorOfSafety[cat.fosKey] : null;
              const isExpanded = !!expandedAccordions[cat.id];

              return (
                <div key={cat.id} className={`rec-accordion-item ${isExpanded ? 'active' : ''}`}>
                  <div className="rec-accordion-header" onClick={() => toggleAccordion(cat.id)}>
                    <div className="rec-accordion-title">
                      <span className="rec-accordion-toggle-icon">▶</span>
                      <span>{cat.title}</span>
                    </div>
                    {fosVal ? (
                      <span className="rec-accordion-fos">FoS {fosVal.toFixed(2)}</span>
                    ) : ''}
                  </div>
                  <div className="rec-accordion-body">
                    <div className="rec-accordion-content">
                      <ul className="rec-accordion-list">{fieldsHTML}</ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {watchHTML}
          {recommendationHTML}
        </div>

        {/* Engineer notes */}
        <div className="rp-section">
          <div className="rp-section-title">Engineer Notes</div>
          <div className="comment-box">"{s.comment}"</div>
        </div>

        {/* Confidence Ring details */}
        <div className="rp-section" style={{ borderBottom: 'none' }}>
          <div className="rp-section-title">Confidence</div>
          <div className="confidence-ring-row">
            <ConfidenceRing pct={s.confidence} col={col} />
            <div className="conf-detail">
              <div className="conf-detail-row"><span>Ground type</span><b>{Math.min(s.confidence + 4, 99)}%</b></div>
              <div className="conf-detail-row"><span>Fault prediction</span><b>{Math.max(s.confidence - 3, 0)}%</b></div>
              <div className="conf-detail-row"><span>Support recommendation</span><b>{Math.min(s.confidence + 2, 99)}%</b></div>
              <div className="conf-detail-row"><span>Engineering package</span><b>{s.recommendationConfidence.overall}%</b></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
