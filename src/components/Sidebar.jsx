import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, ClipboardList, Sparkles, BarChart3, UserCircle, LogOut, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/volunteers', icon: Users, label: 'Volunteers' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/ai-assign', icon: Sparkles, label: 'AI Assign' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: UserCircle, label: 'My Profile' },
];

export default function Sidebar() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, paddingLeft: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}>
          <Heart size={18} color="white" fill="white" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>SevaSync</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 'var(--radius-md)',
              fontWeight: isActive ? 600 : 500, fontSize: 15,
              color: isActive ? 'var(--saffron-dark)' : 'var(--ink-muted)',
              background: isActive ? 'var(--saffron-light)' : 'transparent',
              transition: 'all 0.15s ease',
            })}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
            {(userProfile?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile?.name || 'User'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{userProfile?.role || 'volunteer'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--red)' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{ width: 260, background: 'var(--white)', borderRight: '1px solid var(--border)', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, display: 'flex', flexDirection: 'column' }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--white)', borderBottom: '1px solid var(--border)', zIndex: 200, alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={14} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>SevaSync</span>
        </div>
        <button onClick={() => setOpen(!open)} className="btn-ghost" style={{ padding: 8 }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 260, height: '100%', background: 'var(--white)', borderRight: '1px solid var(--border)' }}>
            <SidebarContent />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-top: 60px; }
        }
      `}</style>
    </>
  );
}
