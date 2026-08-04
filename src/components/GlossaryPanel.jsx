import React from 'react';

export default function GlossaryPanel({
  isOpen,
  onClose
}) {
  return (
    <div className={`glossary-panel ${isOpen ? 'open' : ''}`} id="glossaryPanel">
      <div className="glossary-head">
        <h3>Plain-English Glossary</h3>
        <div 
          className="glossary-close" 
          id="glossaryClose"
          onClick={onClose}
        >
          ✕
        </div>
      </div>
      <div className="glossary-body">
        <div>
          <div className="gterm">RMR (Rock Mass Rating)</div>
          <div className="gdef">A score from 0–100 describing how strong and stable the rock is. Higher = better rock, needs less support. Below ~40 usually means weak, risky ground.</div>
        </div>
        <div>
          <div className="gterm">Q-System (Q-value)</div>
          <div className="gdef">Another rock-quality score, ranging from about 0.001 (very poor, squeezing ground) to 1000 (excellent, almost solid rock). Used alongside RMR to decide how much tunnel support is needed.</div>
        </div>
        <div>
          <div className="gterm">GSI (Geological Strength Index)</div>
          <div className="gdef">A 0–100 score describing how broken-up/fractured the rock mass looks. Lower numbers mean more fractured, weaker rock.</div>
        </div>
        <div>
          <div className="gterm">Support Class (S1–S5)</div>
          <div className="gdef">How much reinforcement (bolts, sprayed concrete, steel ribs) this section needs. S1 = minimal support. S5 = heavy reinforcement, this is the riskiest ground type.</div>
        </div>
        <div>
          <div className="gterm">Fault zone probability</div>
          <div className="gdef">The estimated chance that a geological fault (a fracture where rock has shifted) crosses this section. Faults are weak, unpredictable zones — higher probability means higher risk of sudden ground movement.</div>
        </div>
        <div>
          <div className="gterm">Water ingress probability</div>
          <div className="gdef">The estimated chance that groundwater will seep or flow into the tunnel at this section. High values mean the crew should expect wet conditions and may need drainage/grouting.</div>
        </div>
        <div>
          <div className="gterm">Prediction confidence</div>
          <div className="gdef">How sure the model is about its own prediction for this section. Sections already excavated have high confidence (directly observed). Sections ahead of the tunnel face are forecasts — confidence is lower the further ahead they are.</div>
        </div>
        <div>
          <div className="gterm">Chainage</div>
          <div className="gdef">Just a distance marker along the tunnel, measured in metres from the starting portal — e.g. "2+070" means 2,070 metres in. It's how engineers say "where" along the tunnel something is.</div>
        </div>
        <div>
          <div className="gterm">Ahead of face / Forecast</div>
          <div className="gdef">The tunnel-boring machine has a "face" — the point it has currently dug up to. Ground beyond that point hasn't been excavated yet, so anything shown there is a prediction, not a direct observation.</div>
        </div>
      </div>
    </div>
  );
}
