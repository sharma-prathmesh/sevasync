import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { Sparkles, Users, ClipboardList, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export default function AIAssign() {
  const { showToast } = useToast();
  const [volunteers, setVolunteers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [assignedVolunteer, setAssignedVolunteer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [vSnap, tSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'tasks'))
      ]);
      setVolunteers(vSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.available !== false && u.role !== 'admin'));
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.status === 'open'));
      setLoading(false);
    };
    fetchData();
  }, []);

  const analyzeWithGemini = async () => {
    if (!selectedTask) return showToast('Please select a task first', 'error');
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return;
    if (volunteers.length === 0) return showToast('No available volunteers found', 'error');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'demo') {
      showToast('Please add your Gemini API key in .env file', 'error');
      return;
    }

    setAnalyzing(true); setResult(null); setAssignedVolunteer(null);

    const volunteerList = volunteers
        .slice(0, 5) // 👈 sirf first 5 volunteers
        .map(v =>
            `- Name: ${v.name}, Location: ${v.location || 'Unknown'}, Skills: ${(v.skills || []).join(', ') || 'General'}`
        )
        .join('\n');

    const prompt = `
Pick best volunteer for this task.

Task:
${task.title}, ${task.category}, ${task.location}
Skills: ${(task.requiredSkills || []).join(', ')}

Volunteers:
${volunteerList}

Return ONLY JSON:
{
"bestVolunteerName": "",
"matchScore": 0,
"reasoning": ""
}
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          })
        }
      );

      const data = await response.json();

      if (data.error) {
        showToast(`Gemini Error: ${data.error.message}`, 'error');
        setAnalyzing(false);
        return;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log("RAW GEMINI RESPONSE:", text);

// 🧠 Smart extraction (NO JSON.parse dependency)
      const getValue = (key) => {
        const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
        return match ? match[1] : null;
      };

      const getNumber = (key) => {
        const match = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
        return match ? Number(match[1]) : null;
      };

      const parsed = {
        bestVolunteerName: getValue("bestVolunteerName") || "Unknown",
        matchScore: getNumber("matchScore") || 50,
        reasoning: getValue("reasoning") || "AI response incomplete",
        alternativeName: getValue("alternativeName"),
        warning: null,
        keyReasons: []
      };

      setResult(parsed);
      const matched = volunteers.find(v => v.name?.toLowerCase() === parsed.bestVolunteerName?.toLowerCase());
      if (matched) setAssignedVolunteer(matched);

    } catch (err) {
      console.error('Error:', err);
      showToast('AI analysis failed. Check console for details.', 'error');
    }
    setAnalyzing(false);
  };

  const confirmAssignment = async () => {
    if (!assignedVolunteer || !selectedTask) return;
    try {
      await updateDoc(doc(db, 'tasks', selectedTask), {
        status: 'assigned',
        assignedTo: assignedVolunteer.id,
        assignedToName: assignedVolunteer.name,
        assignedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'analyses'), {
        taskId: selectedTask,
        volunteerName: assignedVolunteer.name,
        matchScore: result.matchScore,
        reasoning: result.reasoning,
        createdAt: new Date().toISOString()
      });
      showToast(`${assignedVolunteer.name} assigned successfully!`);
      setTasks(prev => prev.filter(t => t.id !== selectedTask));
      setSelectedTask(''); setResult(null); setAssignedVolunteer(null);
    } catch {
      showToast('Assignment failed', 'error');
    }
  };

  const scoreColor = (score) => score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ padding: '40px 36px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            <Sparkles size={22} color="white" />
          </div>
          <h1 style={{ fontSize: 28 }}>AI Auto-Assign</h1>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>Gemini AI analyzes volunteers and finds the perfect match.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: ClipboardList, label: 'Open Tasks', value: tasks.length, color: 'var(--saffron)', bg: 'var(--saffron-light)' },
          { icon: Users, label: 'Available Volunteers', value: volunteers.length, color: 'var(--sky)', bg: 'var(--sky-light)' },
          { icon: Zap, label: 'AI Powered', value: 'Gemini', color: '#7C3AED', bg: '#EDE9FE' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>Select a Task to Assign</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 16 }}>AI will analyze all available volunteers and find the perfect match.</p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><span className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--ink-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
            <ClipboardList size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p>No open tasks. Create tasks first!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {tasks.map(t => (
                <button key={t.id} onClick={() => setSelectedTask(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 'var(--radius-md)', border: `2px solid ${selectedTask === t.id ? 'var(--saffron)' : 'var(--border)'}`, background: selectedTask === t.id ? 'var(--saffron-light)' : 'var(--white)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedTask === t.id ? 'var(--saffron)' : 'var(--border)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t.location} · {t.category} · {t.volunteersNeeded} needed</div>
                  </div>
                  <span className="badge badge-orange">{t.status}</span>
                </button>
              ))}
            </div>
            <button onClick={analyzeWithGemini} disabled={analyzing || !selectedTask} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 24px', background: 'linear-gradient(135deg, #7C3AED, var(--saffron))', boxShadow: '0 4px 20px rgba(124,58,237,0.3)', opacity: (!selectedTask || analyzing) ? 0.6 : 1 }}>
              {analyzing ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> AI is analyzing...</> : <><Sparkles size={18} /> Analyze & Find Best Match</>}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="card" style={{ animation: 'fadeUp 0.4s ease', border: '2px solid #7C3AED20' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Sparkles size={20} color="#7C3AED" />
            <h3 style={{ fontSize: 18 }}>AI Recommendation</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `conic-gradient(${scoreColor(result.matchScore)} ${result.matchScore * 3.6}deg, var(--border) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: scoreColor(result.matchScore) }}>{result.matchScore}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4 }}>Best Match</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{result.bestVolunteerName}</div>
              <div style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>Match Score: {result.matchScore}/100</div>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7 }}>{result.reasoning}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {result.keyReasons?.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                <CheckCircle size={16} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: 'var(--ink-soft)' }}>{r}</span>
              </div>
            ))}
          </div>
          {result.warning && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: 'var(--yellow-light)', borderRadius: 'var(--radius-md)', fontSize: 14, color: '#92400E', marginBottom: 16 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{result.warning}</span>
            </div>
          )}
          {result.alternativeName && <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 20 }}>Alternative: <strong>{result.alternativeName}</strong></p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => { setResult(null); setAssignedVolunteer(null); }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Try Again</button>
            <button onClick={confirmAssignment} className="btn-primary" style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, #7C3AED, var(--saffron))' }}>
              <CheckCircle size={16} /> Confirm Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
