import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { Users, Plus, Search, MapPin, Star, X, Check } from 'lucide-react';

const SKILLS = ['Medical', 'Teaching', 'Driving', 'Cooking', 'Construction', 'IT Support', 'Counseling', 'Logistics', 'First Aid', 'Translation'];
const CATEGORIES = ['All', 'Medical', 'Teaching', 'Logistics', 'IT', 'Cooking', 'Construction', 'Other'];

export default function Volunteers() {
  const { showToast } = useToast();
  const [volunteers, setVolunteers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', skills: [], available: true });
  const [saving, setSaving] = useState(false);

  const fetchVolunteers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'volunteer' || !u.role);
    setVolunteers(data); setFiltered(data); setLoading(false);
  };

  useEffect(() => { fetchVolunteers(); }, []);

  useEffect(() => {
    let result = volunteers;
    if (search) result = result.filter(v => v.name?.toLowerCase().includes(search.toLowerCase()) || v.location?.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'All') result = result.filter(v => v.skills?.includes(filterCat));
    setFiltered(result);
  }, [search, filterCat, volunteers]);

  const toggleSkill = (skill) => {
    setForm(f => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill] }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location) return showToast('Name and location are required', 'error');
    setSaving(true);
    try {
      await addDoc(collection(db, 'users'), { ...form, role: 'volunteer', tasksCompleted: 0, joinedAt: new Date().toISOString() });
      showToast('Volunteer added successfully!');
      setForm({ name: '', email: '', phone: '', location: '', skills: [], available: true });
      setShowForm(false);
      fetchVolunteers();
    } catch { showToast('Failed to add volunteer', 'error'); }
    setSaving(false);
  };

  const toggleAvailability = async (id, current) => {
    await updateDoc(doc(db, 'users', id), { available: !current });
    fetchVolunteers();
  };

  return (
    <div style={{ padding: '40px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Volunteers</h1>
          <p style={{ color: 'var(--ink-muted)' }}>{filtered.length} volunteers in the system</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Add Volunteer
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
          <input className="input-field" style={{ paddingLeft: 40 }} placeholder="Search by name or location..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500, border: `1.5px solid ${filterCat === cat ? 'var(--saffron)' : 'var(--border)'}`, background: filterCat === cat ? 'var(--saffron-light)' : 'var(--white)', color: filterCat === cat ? 'var(--saffron-dark)' : 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Volunteer Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No volunteers found</p>
          <p>Try adjusting your search or add a new volunteer.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map((v, i) => (
            <div key={v.id} className="card" style={{ animation: `fadeUp ${0.2 + i * 0.05}s ease` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                    {(v.name || 'V')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{v.name}</div>
                    {v.email && <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{v.email}</div>}
                  </div>
                </div>
                <button onClick={() => toggleAvailability(v.id, v.available)}
                  style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', background: v.available ? 'var(--emerald-light)' : 'var(--surface-2)', color: v.available ? '#065F46' : 'var(--ink-muted)', cursor: 'pointer' }}>
                  {v.available ? '✓ Available' : '✗ Busy'}
                </button>
              </div>

              {v.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12 }}>
                  <MapPin size={13} /> {v.location}
                </div>
              )}

              {v.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {v.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Star size={13} color="var(--yellow)" fill="var(--yellow)" />
                <span>{v.tasksCompleted || 0} tasks completed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Volunteer Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20 }}>Add New Volunteer</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[['name', 'Full Name', 'text', true], ['email', 'Email Address', 'email', false], ['phone', 'Phone Number', 'tel', false], ['location', 'Location / City', 'text', true]].map(([key, label, type, req]) => (
                <div key={key}>
                  <label className="input-label">{label}{req && ' *'}</label>
                  <input type={type} className="input-field" placeholder={`Enter ${label.toLowerCase()}`} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={req} />
                </div>
              ))}
              <div>
                <label className="input-label">Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SKILLS.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, border: `1.5px solid ${form.skills.includes(skill) ? 'var(--saffron)' : 'var(--border)'}`, background: form.skills.includes(skill) ? 'var(--saffron-light)' : 'var(--white)', color: form.skills.includes(skill) ? 'var(--saffron-dark)' : 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {form.skills.includes(skill) && <Check size={12} />} {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : '+ Add Volunteer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
