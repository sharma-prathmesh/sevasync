import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { User, Mail, MapPin, Phone, Save, Star, Check } from 'lucide-react';

const SKILLS = ['Medical', 'Teaching', 'Driving', 'Cooking', 'Construction', 'IT Support', 'Counseling', 'Logistics', 'First Aid', 'Translation'];

export default function Profile() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    location: userProfile?.location || '',
    phone: userProfile?.phone || '',
    skills: userProfile?.skills || [],
    available: userProfile?.available !== false,
  });
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill) => setForm(f => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill] }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), form);
      showToast('Profile updated successfully!');
    } catch { showToast('Failed to update profile', 'error'); }
    setSaving(false);
  };

  return (
    <div style={{ padding: '40px 36px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>My Profile</h1>
        <p style={{ color: 'var(--ink-muted)' }}>Manage your volunteer profile and preferences</p>
      </div>

      {/* Avatar Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, background: 'linear-gradient(135deg, #0F172A, #1E3A5F)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-display)', flexShrink: 0, boxShadow: '0 4px 20px rgba(249,115,22,0.5)' }}>
          {(form.name || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: 22, color: 'white', marginBottom: 4 }}>{form.name || 'Your Name'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{user?.email}</span>
            <span className="badge" style={{ background: 'rgba(249,115,22,0.2)', color: 'var(--saffron)', textTransform: 'capitalize', fontSize: 11 }}>{userProfile?.role || 'volunteer'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            <Star size={13} color="var(--yellow)" fill="var(--yellow)" />
            <span>{userProfile?.tasksCompleted || 0} tasks completed</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, marginBottom: 20 }}>Personal Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
              <input className="input-field" style={{ paddingLeft: 40 }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
            </div>
          </div>
          <div>
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
              <input className="input-field" style={{ paddingLeft: 40, background: 'var(--surface-2)', color: 'var(--ink-muted)' }} value={user?.email || ''} disabled />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                <input className="input-field" style={{ paddingLeft: 40 }} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City or area" />
              </div>
            </div>
            <div>
              <label className="input-label">Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                <input className="input-field" style={{ paddingLeft: 40 }} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>My Skills</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 16 }}>Select all skills that apply — AI uses these for smart matching</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {SKILLS.map(skill => (
            <button key={skill} type="button" onClick={() => toggleSkill(skill)}
              style={{ padding: '8px 16px', borderRadius: 99, fontSize: 14, fontWeight: 500, border: `1.5px solid ${form.skills.includes(skill) ? 'var(--saffron)' : 'var(--border)'}`, background: form.skills.includes(skill) ? 'var(--saffron-light)' : 'var(--white)', color: form.skills.includes(skill) ? 'var(--saffron-dark)' : 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {form.skills.includes(skill) && <Check size={13} />} {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>Availability Status</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Toggle to let organizers know if you're available for tasks</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, available: !f.available }))}
            style={{ width: 52, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: form.available ? 'var(--emerald)' : 'var(--border)', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: form.available ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
        {form.available && <div style={{ marginTop: 12, padding: '8px 14px', background: 'var(--emerald-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#065F46', display: 'inline-block' }}>✓ You are marked as available for tasks</div>}
      </div>

      <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 24px' }}>
        {saving ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving...</> : <><Save size={18} /> Save Profile</>}
      </button>
    </div>
  );
}
