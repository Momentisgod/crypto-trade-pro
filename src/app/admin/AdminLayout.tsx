'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

const NAV_ITEMS = [
  { label: 'Overview',     href: '/admin',             icon: LayoutDashboard },
  { label: 'Users',        href: '/admin/users',       icon: Users },
  { label: 'Deposits',     href: '/admin/deposits',    icon: ArrowDownToLine },
  { label: 'Withdrawals',  href: '/admin/withdrawals', icon: ArrowUpFromLine },
  { label: 'Trades',       href: '/admin/trades',      icon: BarChart2 },
  { label: 'Config',       href: '/admin/config',      icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (res.status === 401) { router.replace('/login');    return; }
        if (res.status === 403) { router.replace('/dashboard'); return; }
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data.data);
        }
        setLoading(false);
      })
      .catch(() => { router.replace('/login'); });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.replace('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-primary)',
      }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} style={{ flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.6))' }} />
          <span>Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-item ${isActive(href) ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive(href) && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {user && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Logged in as
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.username}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                {user.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="main-with-sidebar">
        {children}
      </main>
    </div>
  );
}
