import React from 'react';

export default function TopBar({
  projects,
  activeProject,
  onChangeProject,
  systemStatus,
  onOpenGlossary
}) {
  const status = systemStatus || {
    status: "LIVE",
    lastSyncMinutesAgo: 2,
    faceMethod: "NATM — Drill & Blast",
    excavatedMeters: 4260,
    totalMeters: 9800
  };

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">STRATA</div>
          <div className="brand-sub">Geological Behaviour Prediction</div>
        </div>
      </div>
      <div className="topbar-mid">
        <div className="proj-select">
          <label>Project</label>
          <select 
            id="projectSelect" 
            value={activeProject} 
            onChange={(e) => onChangeProject(e.target.value)}
          >
            {projects && projects.length > 0 ? (
              projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))
            ) : (
              <>
                <option>NH-44 Tunnel T-3 — Pkg 7</option>
                <option>Himank Hydro Headrace Tunnel</option>
                <option>Metro Line 6 — Reach C</option>
              </>
            )}
          </select>
        </div>
        <div className="topbar-stat">
          <span className="label">Excavated</span>
          <span className="val">
            {status.excavatedMeters?.toLocaleString()} m / {status.totalMeters?.toLocaleString()} m
          </span>
        </div>
        <div className="topbar-stat">
          <span className="label">Face Method</span>
          <span className="val">{status.faceMethod}</span>
        </div>
        <div className="topbar-stat">
          <span className="label">Last Sync</span>
          <span className="val">
            {status.lastSyncMinutesAgo} min ago
          </span>
        </div>
      </div>
      <div className="topbar-right">
        <div className="live-pill">
          <span className="live-dot"></span>MODEL {status.status}
        </div>
        <div 
          className="help-btn" 
          id="helpBtn" 
          title="What am I looking at?"
          onClick={onOpenGlossary}
        >
          ?
        </div>
        <div className="avatar">DK</div>
      </div>
    </div>
  );
}
