import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Award, Users, CheckCircle2 } from 'lucide-react';

const COLORS = ['#F97316', '#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const [data, setData] = useState({ tasks: [], volunteers: [], analyses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [tSnap, vSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'analyses')),
      ]);
      setData({
        tasks: tSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        volunteers: vSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        analyses: aSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  // Compute chart data
  const statusData = ['open', 'assigned', 'completed', 'cancelled'].map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: data.tasks.filter(t => t.status === status).length
  })).filter(d => d.value > 0);

  const categoryData = [...new Set(data.tasks.map(t => t.category))].map(cat => ({
    name: cat || 'Other',
    tasks: data.tasks.filter(t => t.category === cat).length
  })).sort((a, b) => b.tasks - a.tasks).slice(0, 6);

  const scoreData = data.analyses.slice(-10).map((a, i) => ({
    name: `#${i + 1}`,
    score: a.matchScore || 0,
  }));

  const skillsData = {};
  data.volunteers.forEach(v => v.skills?.forEach(s => { skillsData[s] = (skillsData[s] || 0) + 1; }));
  const topSkills = Object.entries(skillsData).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const completionRate = data.tasks.length > 0 ? Math.round((data.tasks.filter(t => t.status === 'completed').length / data.tasks.length) * 100) : 0;
  const avgScore = data.analyses.length > 0 ? Math.round(data.analyses.reduce((sum, a) => sum + (a.matchScore || 0), 0) / data.analyses.length) : 0;

  const kpis = [
    { label: 'Total Tasks', value: data.tasks.length, icon: CheckCircle2, color: 'var(--saffron)', bg: 'var(--saffron-light)' },
    { label: 'Total Volunteers', value: data.volunteers.length, icon: Users, color: 'var(--sky)', bg: 'var(--sky-light)' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'var(--emerald)', bg: 'var(--emerald-light)' },
    { label: 'Avg AI Score', value: avgScore || '—', icon: Award, color: '#8B5CF6', bg: '#EDE9FE' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );

  return (
    <div style={{ padding: '40px 36px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Analytics</h1>
        <p style={{ color: 'var(--ink-muted)' }}>Track your volunteer coordination impact</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 32 }}>
        {kpis.map((k, i) => (
          <div key={k.label} className="card" style={{ animation: `fadeUp ${0.2 + i * 0.1}s ease` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} color={k.color} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Status Pie */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Task Status Distribution</h3>
          {statusData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Bar */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Tasks by Category</h3>
          {categoryData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                <Tooltip />
                <Bar dataKey="tasks" fill="var(--saffron)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* AI Match Scores */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>AI Match Scores (Last 10)</h3>
          {scoreData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>
              <p>No AI analyses yet.</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Use AI Assign to see scores here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                <Tooltip formatter={(v) => [`${v}/100`, 'Match Score']} />
                <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Skills */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Top Volunteer Skills</h3>
          {topSkills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>No volunteer skills data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topSkills.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', textAlign: 'right' }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{s.count} volunteers</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: COLORS[i % COLORS.length], width: `${(s.count / topSkills[0].count) * 100}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
