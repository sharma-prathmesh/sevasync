import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, User, Shield, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'volunteer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isRegister) await register(form.email, form.password, form.name, form.role);
      else await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message.includes('user-not-found') ? 'No account found with this email.' :
        err.message.includes('wrong-password') ? 'Incorrect password.' :
        err.message.includes('email-already') ? 'Email already registered.' :
        err.message.includes('weak-password') ? 'Password must be 6+ characters.' :
        'Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)' }}>
      {/* Left Panel */}
      <div style={{ flex: 1, background: 'linear-gradient(145deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }} className="login-left">
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 400, animation: 'fadeUp 0.6s ease' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 30px rgba(249,115,22,0.5)', animation: 'pulse-ring 2.5s ease infinite' }}>
            <Heart size={34} color="white" fill="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, color: 'white', marginBottom: 16 }}>SevaSync</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.7, marginBottom: 48 }}>
            Connecting passionate volunteers with meaningful causes through intelligent coordination.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['🤝 Smart AI-powered task matching', '📍 Location-based volunteer coordination', '📊 Real-time impact analytics', '✅ Automated assignment & tracking'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }} className="login-right">
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.5s ease' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>
            {isRegister ? 'Create account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 32, fontSize: 15 }}>
            {isRegister ? 'Join the SevaSync community today' : 'Sign in to your SevaSync account'}
          </p>

          {error && (
            <div style={{ background: 'var(--red-light)', color: '#991B1B', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 14, border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {isRegister && (
              <div>
                <label className="input-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                  <input className="input-field" style={{ paddingLeft: 40 }} placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
              </div>
            )}

            <div>
              <label className="input-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                <input type="email" className="input-field" style={{ paddingLeft: 40 }} placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="input-field" style={{ paddingLeft: 40, paddingRight: 40 }} placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--ink-muted)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="input-label">I am joining as</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ value: 'volunteer', label: '🙋 Volunteer', desc: 'I want to help' }, { value: 'admin', label: '🛠️ Organizer', desc: 'I manage events' }].map(r => (
                    <button key={r.value} type="button" onClick={() => set('role', r.value)}
                      style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.role === r.value ? 'var(--saffron)' : 'var(--border)'}`, background: form.role === r.value ? 'var(--saffron-light)' : 'var(--white)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing...</> : isRegister ? '🚀 Create Account' : '→ Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span style={{ color: 'var(--ink-muted)', fontSize: 14 }}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ background: 'none', color: 'var(--saffron)', fontWeight: 600, fontSize: 14 }}>
              {isRegister ? 'Sign In' : 'Register Free'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
