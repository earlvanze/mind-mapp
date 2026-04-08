import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Props {
  onClose: () => void;
  onAuth: (email: string) => void;
}

export default function AuthDialog({ onClose, onAuth }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog auth-dialog" onClick={e => e.stopPropagation()}>
          <h2>🔒 Cloud Sync Not Configured</h2>
          <p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> to enable auth and cloud save.</p>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    const { error } = await supabase!.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) setError(error.message);
    else setMessage('✨ Check your email for a magic link!');
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    if (mode === 'signup') {
      const { error } = await supabase!.auth.signUp({ email, password });
      if (error) setError(error.message);
      else { setMessage('✅ Account created! Check your email to confirm.'); onAuth(email); }
    } else {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else { onAuth(email); onClose(); }
    }
    setLoading(false);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog auth-dialog" onClick={e => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        <h2>{mode === 'magic' ? '✨ Magic Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}</h2>
        
        <div className="auth-tabs">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setMessage(''); }}>Password</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Sign Up</button>
          <button className={mode === 'magic' ? 'active' : ''} onClick={() => { setMode('magic'); setError(''); setMessage(''); }}>Magic Link</button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        {mode === 'magic' ? (
          <form onSubmit={handleMagicLink}>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send Magic Link'}</button>
          </form>
        ) : (
          <form onSubmit={handlePassword}>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required={mode === 'signin'} minLength={6} />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
