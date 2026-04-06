import React, { useState } from 'react';

export default function ConsultationScheduler() {
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');

    // Simuleer netwerk vertraging (V13 server check)
    setTimeout(() => {
      setStep('success');
    }, 1500);
  };

  return (
    <div className="react-panel">
      {/* HEADER */}
      <div className="react-header">
        <div className="react-icon">
          {/* React Icon (Atom) */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
        </div>
        <div>
          <h3 className="react-title">Priority Scheduling</h3>
          <p className="react-sub">Powered by React Core</p>
        </div>
      </div>

      {/* STATES */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="react-form">
          <div className="input-group">
            <label>Project Type</label>
            <select className="react-input">
              <option>Full Renovation</option>
              <option>Kitchen / Bath</option>
              <option>Extension</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="hello@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="react-input"
            />
          </div>

          <button type="submit" className="react-btn">
            Check Availability
          </button>
        </form>
      )}

      {step === 'loading' && (
        <div className="status-box">
          <div className="spinner"></div>
          <p>Syncing with calendar...</p>
        </div>
      )}

      {step === 'success' && (
        <div className="status-box success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <p>Request Received.</p>
          <span className="small">We will contact {email} shortly.</span>
          <button onClick={() => setStep('form')} className="reset-link">New request</button>
        </div>
      )}
      
      {/* IN-COMPONENT STYLES (Scoped via class names mapped to global CSS vars) */}
      <style>{`
        .react-panel {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          height: 100%;
          min-height: 300px;
          display: flex;
          flex-direction: column;
        }
        .react-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .react-icon { 
          width: 32px; height: 32px; background: rgba(97, 218, 251, 0.1); 
          color: #61DAFB; border: 1px solid rgba(97, 218, 251, 0.3);
          border-radius: 8px; display: grid; place-items: center;
        }
        .react-icon svg { width: 18px; height: 18px; }
        .react-title { color: var(--white); font-weight: 600; font-size: 1rem; margin: 0; }
        .react-sub { color: var(--text); font-size: 0.8rem; margin: 0; }

        .react-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.75rem; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .react-input {
          background: rgba(0,0,0,0.3); border: 1px solid var(--border);
          padding: 0.75rem; border-radius: 8px; color: white; font-size: 0.9rem;
          outline: none; transition: 0.2s; width: 100%;
        }
        .react-input:focus { border-color: #61DAFB; }

        .react-btn {
          margin-top: 0.5rem;
          background: #61DAFB; color: #000; font-weight: 600;
          padding: 0.8rem; border-radius: 8px; border: none; cursor: pointer;
          transition: 0.2s;
        }
        .react-btn:hover { background: #fff; }

        .status-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text); gap: 1rem; animation: fadeIn 0.3s ease; }
        .status-box svg { width: 40px; height: 40px; color: #22c55e; }
        .status-box.success { color: var(--white); }
        .small { font-size: 0.85rem; color: var(--text); }
        .reset-link { background: none; border: none; color: #61DAFB; font-size: 0.8rem; cursor: pointer; margin-top: 1rem; text-decoration: underline; }

        .spinner {
          width: 24px; height: 24px; border: 2px solid var(--border);
          border-top-color: #61DAFB; border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}