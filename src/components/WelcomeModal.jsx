import React, { useState } from 'react';

export default function WelcomeModal({
  visible,
  onClose
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!visible) return null;

  const handleStartClick = () => {
    onClose(dontShowAgain);
  };

  return (
    <div className="modal-overlay" id="welcomeModal">
      <div className="modal-card">
        <div className="modal-head">
          <div className="k">Quick Start</div>
          <h2>What this dashboard shows</h2>
        </div>
        <div className="modal-body">
          <div className="modal-step">
            <div className="num">1</div>
            <div className="txt">
              The <b>grey/orange shape in the middle</b> is a side-view of the mountain the tunnel passes through. The horizontal tube running through it is the <b>tunnel itself</b> — coloured green, yellow or red depending on how risky that section of ground is.
            </div>
          </div>
          <div className="modal-step">
            <div className="num">2</div>
            <div className="txt">
              <b>Click anywhere on the mountain or tunnel</b> to select that section. The panel on the right will update with everything known about the ground at that point.
            </div>
          </div>
          <div className="modal-step">
            <div className="num">3</div>
            <div className="txt">
              Every technical term (like RMR, GSI, Q-value) has a small <b>"?" symbol</b> next to it — hover over it any time for a plain-English explanation. There's also a plain-language summary sentence at the top of every panel.
            </div>
          </div>
          <div className="modal-step">
            <div className="num">4</div>
            <div className="txt">
              <b style={{ color: 'var(--green)' }}>Green</b> = safe, proceed as planned. <b style={{ color: 'var(--yellow)' }}>Yellow</b> = caution, extra support needed. <b style={{ color: 'var(--red)' }}>Red</b> = high risk, requires reinforcement and careful monitoring before excavation reaches that point.
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <label>
            <input 
              type="checkbox" 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />{' '}
            Don't show this again
          </label>
          <button 
            className="modal-btn" 
            id="closeWelcome"
            onClick={handleStartClick}
          >
            Got it, let's start
          </button>
        </div>
      </div>
    </div>
  );
}
