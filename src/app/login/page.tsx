'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, TrendingUp, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Validation Schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// ─── Floating Crypto Label ─────────────────────────────────────────────────
const FLOAT_ICONS = [
  { symbol: '₿', label: 'BTC', color: '#f59e0b', top: '12%', left: '6%',  size: 44, delay: '0s',    duration: '7s'  },
  { symbol: 'Ξ', label: 'ETH', color: '#8b5cf6', top: '70%', left: '4%',  size: 38, delay: '1.2s',  duration: '9s'  },
  { symbol: '◎', label: 'SOL', color: '#06b6d4', top: '30%', right: '5%', size: 36, delay: '0.6s',  duration: '8s'  },
  { symbol: '✦', label: 'BNB', color: '#f59e0b', top: '80%', right: '8%', size: 32, delay: '2s',    duration: '10s' },
  { symbol: '◈', label: 'ADA', color: '#3b82f6', top: '50%', left: '8%',  size: 30, delay: '1.5s',  duration: '6s'  },
  { symbol: '⬡', label: 'XRP', color: '#10b981', top: '15%', right: '9%', size: 34, delay: '0.3s',  duration: '11s' },
  { symbol: '◆', label: 'DOT', color: '#ec4899', top: '60%', right: '4%', size: 28, delay: '2.5s',  duration: '7.5s'},
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setApiError(json.error ?? json.message ?? 'Login failed. Please try again.');
      } else {
        toast.success('Welcome back! Redirecting…');
        router.push('/dashboard');
      }
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Animated gradient orbs ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'orbFloat1 12s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'orbFloat2 14s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', top: '40%', right: '20%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'orbFloat3 10s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Grid overlay ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(rgba(30,45,71,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,71,0.25) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Floating crypto symbols ───────────────────────────────────── */}
      {mounted && FLOAT_ICONS.map((icon) => (
        <div
          key={icon.label}
          style={{
            position: 'absolute',
            top: icon.top,
            left: 'left' in icon ? icon.left : undefined,
            right: 'right' in icon ? (icon as {right?: string}).right : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            animation: `floatY ${icon.duration} ease-in-out infinite`,
            animationDelay: icon.delay,
            opacity: 0.22,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: icon.size, color: icon.color, lineHeight: 1 }}>{icon.symbol}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: icon.color, letterSpacing: '0.08em' }}>{icon.label}</span>
        </div>
      ))}

      {/* ── Keyframes via style tag ───────────────────────────────────── */}
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-50px, -40px) scale(1.08); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(30px, -25px); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(5deg); }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes logoShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* ── Login Card ────────────────────────────────────────────────── */}
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.12)',
          animation: 'cardEntrance 0.55s cubic-bezier(0.22,1,0.36,1) both',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64, height: 64,
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              fontSize: 28,
            }}
          >
            ₿
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #34d399, #60a5fa)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'logoShimmer 4s linear infinite',
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            CryptoTrade Pro
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            Professional Crypto Trading Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Email */}
          <div>
            <label className="input-label" htmlFor="email">
              <Mail size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
              style={errors.email ? { borderColor: 'var(--accent-red)', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' } : {}}
              {...register('email')}
            />
            {errors.email && (
              <p style={{ marginTop: 5, fontSize: 12, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⚠</span> {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="input-label" htmlFor="password">
              <Lock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  paddingRight: 44,
                  ...(errors.password ? { borderColor: 'var(--accent-red)', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' } : {}),
                }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ marginTop: 5, fontSize: 12, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⚠</span> {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: 'right', marginTop: -12 }}>
            <span style={{ fontSize: 12, color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }}>
              Forgot password?
            </span>
          </div>

          {/* API Error */}
          {apiError && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10,
                fontSize: 13,
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠</span>
              {apiError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            style={{ width: '100%', marginTop: 4, position: 'relative', overflow: 'hidden' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '28px 0 20px',
            color: 'var(--text-muted)', fontSize: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>Don't have an account?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Register link */}
        <Link
          href="/register"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 20px',
            border: '1px solid var(--border-light)',
            borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <TrendingUp size={16} />
          Create a free account
        </Link>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 24 }}>
          By signing in you agree to our{' '}
          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Terms of Service</span>
          {' & '}
          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
