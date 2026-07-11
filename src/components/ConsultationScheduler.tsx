import React, { useState } from 'react';

// NORTHRIDGE site-visit scheduler (form → checking → confirmed).
export default function ConsultationScheduler() {
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [email, setEmail] = useState('');
  const [project, setProject] = useState('Full renovation');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    window.setTimeout(() => setStep('success'), 1400);
  };

  return (
    <div className="sched">
      <div className="sched-head">
        <div className="sched-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 15h3" />
          </svg>
        </div>
        <div>
          <h3 className="sched-title">Book a site visit</h3>
          <p className="sched-sub">We confirm timing within one business day.</p>
        </div>
      </div>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="sched-form">
          <div className="ig">
            <label htmlFor="cs-project">Project type</label>
            <select id="cs-project" className="sched-input" value={project} onChange={(e) => setProject(e.target.value)}>
              <option>Full renovation</option>
              <option>Kitchen / bathroom</option>
              <option>Extension</option>
            </select>
          </div>
          <div className="ig">
            <label htmlFor="cs-email">Email address</label>
            <input id="cs-email" type="email" required placeholder="you@home.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sched-input" />
          </div>
          <button type="submit" className="sched-btn">Check availability</button>
        </form>
      )}

      {step === 'loading' && (
        <div className="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Checking the calendar…</p>
        </div>
      )}

      {step === 'success' && (
        <div className="status ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          <p>Request received.</p>
          <span className="small">A {project.toLowerCase()} visit , we'll email {email || 'you'} shortly.</span>
          <button onClick={() => setStep('form')} className="reset">New request</button>
        </div>
      )}

      <style>{`
        .sched { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; height: 100%; min-height: 300px; display: flex; flex-direction: column; }
        .sched-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .sched-ic { width: 34px; height: 34px; background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.3); border-radius: 9px; display: grid; place-items: center; }
        .sched-ic svg { width: 18px; height: 18px; }
        .sched-title { color: #fff; font-weight: 600; font-size: 1rem; margin: 0; letter-spacing: -0.01em; }
        .sched-sub { color: #a1a1aa; font-size: 0.8rem; margin: 0.2rem 0 0; }
        .sched-form { display: flex; flex-direction: column; gap: 1.4rem; }
        .ig { display: flex; flex-direction: column; gap: 0.5rem; }
        .ig label { font-size: 0.72rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.08em; }
        .sched-input { background: rgba(0,0,0,0.34); border: 1px solid rgba(255,255,255,0.12); padding: 0.75rem; border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none; transition: border-color 0.2s; width: 100%; }
        .sched-input:focus { border-color: #34d399; }
        .sched-btn { margin-top: 0.4rem; background: #34d399; color: #04140d; font-weight: 700; padding: 0.85rem; border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s, box-shadow 0.2s; letter-spacing: 0.02em; }
        .sched-btn:hover { background: #6ee7b7; box-shadow: 0 10px 30px -12px rgba(52,211,153,0.6); }
        .status { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a1a1aa; gap: 1rem; text-align: center; animation: csIn 0.3s ease; }
        .status svg { width: 40px; height: 40px; color: #34d399; }
        .status.ok { color: #fff; }
        .small { font-size: 0.85rem; color: #a1a1aa; max-width: 30ch; }
        .reset { background: none; border: none; color: #34d399; font-size: 0.8rem; cursor: pointer; margin-top: 0.6rem; text-decoration: underline; text-underline-offset: 3px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.12); border-top-color: #34d399; border-radius: 50%; animation: csSpin 1s linear infinite; }
        @keyframes csSpin { to { transform: rotate(360deg); } }
        @keyframes csIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}