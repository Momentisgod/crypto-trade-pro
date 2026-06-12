'use client';
import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Users, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number; totalOrders: number; totalVolume: number;
  pendingDeposits: number; pendingWithdrawals: number; approvedDepositsTotal: number;
  recentUsers: { id: string; username: string; email: string; usdtBalance: number; role: string; isActive: boolean; createdAt: number }[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d.data); setLoading(false); });
  }, []);

  const pendingTotal = (stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0);

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Platform Overview</h1>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: stats?.totalUsers ?? '-', icon: Users, color: 'var(--accent-blue)' },
            { label: 'Total Orders', value: stats?.totalOrders ?? '-', icon: ShoppingCart, color: 'var(--accent-purple)' },
            { label: 'Total Volume (USDT)', value: stats ? `$${stats.totalVolume.toLocaleString(undefined,{maximumFractionDigits:0})}` : '-', icon: TrendingUp, color: 'var(--accent-green)' },
            { label: 'Pending Reviews', value: pendingTotal, icon: Clock, color: 'var(--accent-yellow)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                <div className="stat-label">{label}</div>
                <div style={{ width:34,height:34,borderRadius:8,background:`${color}20`,display:'flex',alignItems:'center',justifyContent:'center' }}><Icon size={16} color={color}/></div>
              </div>
              <div className="stat-value" style={{ color }}>{loading ? '...' : value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Recent Users */}
          <div className="card" style={{ padding:0,overflow:'hidden' }}>
            <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14 }}>Recent Users</div>
            {loading ? <div style={{ padding:40,textAlign:'center',color:'var(--text-muted)' }}>Loading...</div> :
              <table style={{ width:'100%' }}>
                <thead><tr><th>Username</th><th>Balance</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {(stats?.recentUsers||[]).map(u => (
                    <tr key={u.id}>
                      <td><div style={{ fontWeight:600 }}>{u.username}</div><div style={{ fontSize:11,color:'var(--text-muted)' }}>{u.email}</div></td>
                      <td style={{ fontWeight:600,color:'var(--accent-blue)' }}>${u.usdtBalance.toFixed(2)}</td>
                      <td><span className={`badge ${u.role==='admin'?'badge-purple':'badge-blue'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Banned'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
          {/* Summary */}
          <div className="card">
            <h3 style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Financial Summary</h3>
            {[
              { label:'Total Approved Deposits', value:`$${(stats?.approvedDepositsTotal||0).toLocaleString(undefined,{maximumFractionDigits:2})}`, color:'var(--accent-green)' },
              { label:'Pending Deposits', value:stats?.pendingDeposits ?? 0, color:'var(--accent-yellow)' },
              { label:'Pending Withdrawals', value:stats?.pendingWithdrawals ?? 0, color:'var(--accent-yellow)' },
              { label:'Total Trade Volume', value:`$${(stats?.totalVolume||0).toLocaleString(undefined,{maximumFractionDigits:2})}`, color:'var(--accent-blue)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:13,color:'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight:700,color }}>{loading ? '...' : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
