'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
  LogOut,
  Bell,
  User,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserInfo {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setUser(d.data);
      })
      .catch(() => {});

    fetch('/api/portfolio', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setUsdtBalance(d.data.usdtBalance);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Trade', icon: TrendingUp },
    { href: '/portfolio', label: 'Portfolio', icon: BarChart2 },
    { href: '/deposit', label: 'Deposit', icon: ArrowDownCircle },
    { href: '/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
  ];

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="navbar" style={{ justifyContent: 'space-between', backdropFilter: 'blur(12px)', background: 'rgba(17, 24, 39, 0.95)', position: 'relative' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} color="white" />
            </div>
            <span style={{
              fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}>
              CryptoTrade Pro
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  transition: 'all 0.2s ease',
                  background: isActive(href) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive(href) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Balance chip */}
        {usdtBalance !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            <Wallet size={13} color="var(--accent-green)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>
              ${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Notification bell */}
        <button
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s',
          }}
          onClick={() => toast.info('No new notifications')}
        >
          <Bell size={16} />
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: 'var(--text-primary)', transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white',
            }}>
              {user?.username?.[0]?.toUpperCase() || <User size={14} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {user?.username || '...'}
            </span>
            <ChevronDown size={13} color="var(--text-muted)" style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'
            }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: 10, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 200, overflow: 'hidden', animation: 'fadeIn 0.15s ease',
              }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}
                  onClick={() => setDropdownOpen(false)}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', cursor: 'pointer',
                    color: isActive(href) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontSize: 13, transition: 'all 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={14} />
                    {label}
                  </div>
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--accent-red)', fontSize: 13,
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.05)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-primary)',
          }}
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 100,
        }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                background: isActive(href) ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: isActive(href) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontSize: 14, fontWeight: 600,
              }}>
                <Icon size={16} />
                {label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
