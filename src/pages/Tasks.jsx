import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { ClipboardList, Plus, MapPin, Calendar, Users, X, Check } from 'lucide-react';

const CATEGORIES = ['Medical', 'Teaching', 'Logistics', 'IT Support', 'Cooking', 'Construction', 'Counseling', 'Other'];
const STATUSES = ['All', 'open', 'assigned', 'completed', 'cancelled'];

export default function Tasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'Medical', requiredSkills: [], date: '', volunteersNeeded: 1, status: 'open' });

  const SKILLS = ['Medical', 'Teaching', 'Driving', 'Cooking', 'Construction', 'IT Support', 'Counseling', 'Logistics', 'First Aid', 'Translation'];

  const fetchTasks = async () => {
    const snap = await getDocs(collection(db, 'tasks'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setTasks(data); setFiltered(data); setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  useEffect(() => {
    setFiltered(statusFilter === 'All' ? tasks : tasks.filter(t => t.status === statusFilter));
  }, [statusFilter, tasks]);

  const toggleSkill = (skill) => {
    setForm(f => ({ ...f, requiredSkills: f.requiredSkills.includes(skill) ? f.requiredSkills.filter(s => s !== skill) : [...f.requiredSkills, skill] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location) return showToast('Title and location are required', 'error');
    setSaving(true);
    try {
      await addDoc(collection(db, 'tasks'), { ...form, volunteersNeeded: Number(form.volunteersNeeded), createdAt: new Date().toISOString() });
      showToast('Task created successfully!');
      setForm({ title: '', description: '', location: '', category: 'Medical', requiredSkills: [], date: '', volunteersNeeded: 1, status: 'open' });
      setShowForm(false);
      fetchTasks();
    } catch { showToast('Failed to create task', 'error'); }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'tasks', id), { status });
    fetchTasks();
    showToast(`Task marked as ${status}`);
  };

  const statusColors = { open: 'badge-orange', assigned: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red' };
  const statusBg = { open: '#FFF7ED', assigned: '#EFF6FF', completed: '#F0FDF4', cancelled: '#FFF1F2' };

  return (
    <div style={{ padding: '40px 36px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Tasks</h1>
          <p style={{ color: 'var(--ink-muted)' }}>{filtered.length} tasks found</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={18} /> Create Task</button>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 500, border: `1.5px solid ${statusFilter === s ? 'var(--saffron)' : 'var(--border)'}`, background: statusFilter === s ? 'var(--saffron-light)' : 'var(--white)', color: statusFilter === s ? 'var(--saffron-dark)' : 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-muted)' }}>
          <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No tasks found</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 8 }}>+ Create First Task</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((t, i) => (
            <div key={t.id} className="card" style={{ animation: `fadeUp ${0.2 + i * 0.04}s ease`, background: statusBg[t.status] || 'white' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 17 }}>{t.title}</h3>
                    <span className={`badge ${statusColors[t.status] || 'badge-orange'}`} style={{ textTransform: 'capitalize' }}>{t.status}</span>
                    <span className="badge badge-blue">{t.category}</span>
                  </div>
                  {t.description && <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>{t.description}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--ink-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {t.location}</span>
                    {t.date && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {t.date}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> {t.volunteersNeeded} needed</span>
                  </div>
                  {t.requiredSkills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {t.requiredSkills.map(s => <span key={s} className="badge badge-orange">{s}</span>)}
                    </div>
                  )}
                </div>
                {t.status === 'open' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => updateStatus(t.id, 'assigned')}
                      style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--sky-light)', color: '#0369A1', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={13} /> Assign
                    </button>
                    <button onClick={() => updateStatus(t.id, 'completed')}
                      style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--emerald-light)', color: '#065F46', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Check size={13} /> Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20 }}>Create New Task</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Task Title *</label>
                <input className="input-field" placeholder="e.g. Medical Camp at Sabarmati" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input-field" rows={3} placeholder="Describe what volunteers need to do..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="input-label">Location *</label>
                  <input className="input-field" placeholder="City or area" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Date</label>
                  <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Volunteers Needed</label>
                  <input type="number" min={1} className="input-field" value={form.volunteersNeeded} onChange={e => setForm(f => ({ ...f, volunteersNeeded: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="input-label">Required Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SKILLS.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      style={{ padding: '6px 12px', borderRadius: 99, fontSize: 13, border: `1.5px solid ${form.requiredSkills.includes(skill) ? 'var(--saffron)' : 'var(--border)'}`, background: form.requiredSkills.includes(skill) ? 'var(--saffron-light)' : 'var(--white)', color: form.requiredSkills.includes(skill) ? 'var(--saffron-dark)' : 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating...</> : '+ Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
