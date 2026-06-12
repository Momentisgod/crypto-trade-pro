'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { toast } from 'sonner';
import { Eye, X, Copy, Clock } from 'lucide-react';

interface Withdrawal {
  id: string; userId: string; username: string; email: string;
  amount: number; network: string; walletAddress: string; status: string;
  txHash: string | null; adminNote: string | null; createdAt: number;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [txHash, setTxHash] = useState('');
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/admin/withdrawals?status=${filter}`).then(r => r.json()).then(d => { setWithdrawals(d.data||[]); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, [filter]);

  const openModal = (w: Withdrawal) => { setSelected(w); setTxHash(''); setNote(''); };

  const doAction = async (action: 'process' | 'cancel') => {
    if (!selected) return;
    if (action === 'process' && !txHash.trim()) { toast.error('TX hash is required'); return; }
    if (action === 'cancel' && !note.trim()) { toast.error('Cancellation reason is required'); return; }
    setActing(true);
    try {
      const body = action === 'process' ? { txHash, adminNote: note } : { adminNote: note };
      const res = await fetch(`/api/admin/withdrawals/${selected.id}/${action}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.data?.message);
      setSelected(null);
      fetchData();
    } catch { toast.error('Action failed'); }
    finally { setActing(false); }
  };

  const pending = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <AdminLayout>
      {selected && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:500 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <h3 style={{ fontSize:18,fontWeight:700 }}>Withdrawal #{selected.id.slice(-8)}</h3>
              <button onClick={() => setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ background:'var(--bg-secondary)',borderRadius:10,padding:16,marginBottom:16,fontSize:13 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 2fr',gap:10 }}>
                <span style={{ color:'var(--text-muted)' }}>User</span><span style={{ fontWeight:600 }}>@{selected.username} ({selected.email})</span>
                <span style={{ color:'var(--text-muted)' }}>Amount</span><span style={{ fontWeight:800,fontSize:18,color:'var(--accent-red)' }}>${selected.amount.toFixed(2)} USDT</span>
                <span style={{ color:'var(--text-muted)' }}>Network</span><span><span className="badge badge-blue">{selected.network}</span></span>
                <span style={{ color:'var(--text-muted)' }}>To Address</span>
                <span style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <code style={{ fontSize:11,wordBreak:'break-all',color:'var(--text-secondary)' }}>{selected.walletAddress}</code>
                  <button onClick={() => { navigator.clipboard.writeText(selected.walletAddress); toast.success('Copied!'); }} style={{ flexShrink:0,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 6px',cursor:'pointer',color:'var(--text-muted)' }}><Copy size={10}/></button>
                </span>
                <span style={{ color:'var(--text-muted)' }}>Submitted</span><span style={{ fontSize:12 }}>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div style={{ background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'var(--accent-blue)' }}>
              📤 Send <strong>${selected.amount.toFixed(2)} USDT</strong> via <strong>{selected.network}</strong> to the address above, then paste the TX hash below.
            </div>
            {selected.status === 'pending' ? (
              <>
                <div style={{ marginBottom:12 }}>
                  <label className="input-label">Transaction Hash *</label>
                  <input className="input" placeholder="Paste the TX hash after sending" value={txHash} onChange={e=>setTxHash(e.target.value)} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label className="input-label">Admin Note (optional for process, required for cancel)</label>
                  <textarea className="input" rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note..." style={{ resize:'vertical' }} />
                </div>
                <div style={{ display:'flex',gap:10 }}>
                  <button className="btn btn-green" style={{ flex:1 }} onClick={() => doAction('process')} disabled={acting}>
                    {acting ? <span className="spinner"/> : '✓ Mark as Processed'}
                  </button>
                  <button className="btn btn-red" style={{ flex:1 }} onClick={() => doAction('cancel')} disabled={acting}>
                    {acting ? <span className="spinner"/> : '✕ Cancel & Refund'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center',padding:12,background:'var(--bg-secondary)',borderRadius:10 }}>
                <span className={`badge ${selected.status==='processed'?'badge-green':'badge-red'}`} style={{ fontSize:14,padding:'6px 16px' }}>{selected.status.toUpperCase()}</span>
                {selected.txHash && <p style={{ marginTop:8,fontSize:12,color:'var(--text-muted)',wordBreak:'break-all' }}>TX: {selected.txHash}</p>}
                {selected.adminNote && <p style={{ marginTop:6,fontSize:13,color:'var(--text-muted)' }}>Note: {selected.adminNote}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding:28 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4 }}>Withdrawal Requests</h1>
            {pending > 0 && <div style={{ color:'var(--accent-yellow)',fontSize:13,fontWeight:600 }}><Clock size={13} style={{ display:'inline',marginRight:4 }}/>{pending} pending</div>}
          </div>
        </div>
        <div className="tab-bar" style={{ marginBottom:20,maxWidth:400 }}>
          {['all','pending','processed','cancelled'].map(f => <button key={f} className={`tab ${filter===f?'active':''}`} onClick={() => setFilter(f)} style={{ textTransform:'capitalize' }}>{f}</button>)}
        </div>
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          {loading ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>Loading...</div> :
           withdrawals.length === 0 ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>No withdrawals found.</div> :
           <table style={{ width:'100%' }}>
             <thead><tr><th>#</th><th>User</th><th>Amount</th><th>Network</th><th>Address</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
             <tbody>
               {withdrawals.map((w, i) => (
                 <tr key={w.id} style={{ borderLeft: w.status==='pending' ? '3px solid var(--accent-yellow)' : '3px solid transparent' }}>
                   <td style={{ color:'var(--text-muted)',fontSize:12 }}>{i+1}</td>
                   <td><div style={{ fontWeight:600 }}>@{w.username}</div><div style={{ fontSize:11,color:'var(--text-muted)' }}>{w.email}</div></td>
                   <td style={{ fontWeight:700,color:'var(--accent-red)' }}>${w.amount.toFixed(2)}</td>
                   <td><span className="badge badge-blue">{w.network}</span></td>
                   <td style={{ fontSize:11,color:'var(--text-muted)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{w.walletAddress.slice(0,16)}...</td>
                   <td style={{ fontSize:12,color:'var(--text-muted)' }}>{w.createdAt ? new Date(w.createdAt).toLocaleString() : '-'}</td>
                   <td><span className={`badge ${w.status==='processed'?'badge-green':w.status==='cancelled'?'badge-red':'badge-yellow'}`}>{w.status}</span></td>
                   <td><button className="btn btn-outline btn-sm" onClick={() => openModal(w)}><Eye size={12}/>Review</button></td>
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
