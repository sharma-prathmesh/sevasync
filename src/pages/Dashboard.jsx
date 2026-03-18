import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Users, ClipboardList, CheckCircle2, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ volunteers: 0, tasks: 0, completed: 0, analyses: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vSnap, tSnap, aSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'tasks')),
          getDocs(collection(db, 'analyses')),
        ]);
        const tasks = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStats({
          volunteers: vSnap.size,
          tasks: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          analyses: aSnap.size,
        });
        setRecentTasks(tasks.slice(0, 5));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Volunteers', value: stats.volunteers, icon: Users, color: 'var(--sky)', bg: 'var(--sky-light)', delta: '+12%' },
    { label: 'Active Tasks', value: stats.tasks, icon: ClipboardList, color: 'var(--saffron)', bg: 'var(--saffron-light)', delta: '+5 today' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'var(--emerald)', bg: 'var(--emerald-light)', delta: '+3 this week' },
    { label: 'AI Analyses', value: stats.analyses, icon: Sparkles, color: '#8B5CF6', bg: '#EDE9FE', delta: 'Powered by Gemini' },
  ];

  const quickActions = [
    { label: 'Add Volunteer', desc: 'Register a new volunteer', path: '/volunteers', color: 'var(--sky)' },
    { label: 'Create Task', desc: 'Post a new task or event', path: '/tasks', color: 'var(--saffron)' },
    { label: 'AI Auto-Assign', desc: 'Let AI match volunteers', path: '/ai-assign', color: '#8B5CF6' },
    { label: 'View Analytics', desc: 'See impact reports', path: '/analytics', color: 'var(--emerald)' },
  ];

  const statusColor = { open: 'badge-orange', assigned: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red' };

  return (
    <div style={{ padding: '40px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 30 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            {' '}{userProfile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: 16 }}>
          Here's what's happening with SevaSync today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={s.label} className="card" style={{ animation: `fadeUp ${0.3 + i * 0.1}s ease` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} color={s.color} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600, background: 'var(--emerald-light)', padding: '3px 8px', borderRadius: 99 }}>
                {s.delta}
              </span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: 4 }}>
              {loading ? '—' : s.value}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Recent Tasks */}
        <div className="card" style={{ animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 17 }}>Recent Tasks</h3>
            <button onClick={() => navigate('/tasks')} className="btn-ghost" style={{ fontSize: 13, color: 'var(--saffron)' }}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" /></div>
          ) : recentTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-muted)' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No tasks yet. Create your first task!</p>
              <button onClick={() => navigate('/tasks')} className="btn-primary" style={{ marginTop: 16, fontSize: 14, padding: '10px 20px' }}>+ Create Task</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t.location} · {t.category}</div>
                  </div>
                  <span className={`badge ${statusColor[t.status] || 'badge-orange'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ animation: 'fadeUp 0.55s ease' }}>
          <h3 style={{ fontSize: 17, marginBottom: 20 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = 'var(--white)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{a.desc}</div>
                </div>
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--ink-muted)' }} />
              </button>
            ))}
          </div>

          {/* Impact Banner */}
          <div style={{ marginTop: 20, padding: '16px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #0F172A, #1E3A5F)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <TrendingUp size={16} color="var(--saffron)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--saffron)' }}>Community Impact</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              SevaSync has helped coordinate <strong style={{ color: 'white' }}>{stats.completed}</strong> successful volunteer tasks this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
