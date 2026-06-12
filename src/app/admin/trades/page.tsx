'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';

interface Trade {
  id: string; username: string; email: string; symbol: string;
  side: string; quantity: number; price: number; total: number; status: string; createdAt: number;
}

export default function AdminTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/trades').then(r => r.json()).then(d => { setTrades(d.data||[]); setLoading(false); });
  }, []);

  return (
    <AdminLayout>
      <div style={{ padding:28 }}>
        <h1 style={{ fontSize:24,fontWeight:800,marginBottom:20 }}>Trade Audit Log</h1>
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          {loading ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>Loading...</div> :
           trades.length === 0 ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>No trades yet.</div> :
           <table style={{ width:'100%' }}>
             <thead><tr><th>Date</th><th>User</th><th>Symbol</th><th>Side</th><th>Quantity</th><th>Price</th><th>Total</th><th>Status</th></tr></thead>
             <tbody>
               {trades.map(t => (
                 <tr key={t.id}>
                   <td style={{ fontSize:12,color:'var(--text-muted)' }}>{t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
                   <td><div style={{ fontWeight:600 }}>@{t.username}</div><div style={{ fontSize:11,color:'var(--text-muted)' }}>{t.email}</div></td>
                   <td style={{ fontWeight:700 }}>{t.symbol}</td>
                   <td><span className={`badge ${t.side==='buy'?'badge-green':'badge-red'}`}>{t.side.toUpperCase()}</span></td>
                   <td>{t.quantity.toFixed(6)}</td>
                   <td>${t.price.toLocaleString(undefined,{maximumFractionDigits:4})}</td>
                   <td style={{ fontWeight:700 }}>${t.total.toFixed(2)}</td>
                   <td><span className="badge badge-green">{t.status}</span></td>
                 </tr>
               ))}
             </tbody>
           </table>
          }
        </div>
      </div>
    </AdminLayout>
  );
}
