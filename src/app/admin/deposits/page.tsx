'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { toast } from 'sonner';
import { Eye, X, ZoomIn, Clock } from 'lucide-react';

interface Deposit {
  id: string; userId: string; username: string; email: string;
  amountClaimed: number; amountApproved: number | null; network: string;
  screenshotPath: string; txNote: string | null; status: string;
  adminNote: string | null; createdAt: number;
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [approvedAmt, setApprovedAmt] = useState('');
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const fetchDeposits = () => {
    setLoading(true);
    fetch(`/api/admin/deposits?status=${filter}`).then(r => r.json()).then(d => { setDeposits(d.data||[]); setLoading(false); });
  };

  useEffect(() => { fetchDeposits(); }, [filter]);

  const openModal = (d: Deposit) => { setSelected(d); setApprovedAmt(d.amountClaimed.toString()); setNote(''); };

  const doAction = async (action: 'approve' | 'cancel') => {
    if (!selected) return;
    if (action === 'cancel' && !note.trim()) { toast.error('Rejection reason is required'); return; }
    setActing(true);
    try {
      const body = action === 'approve' ? { amountApproved: parseFloat(approvedAmt), adminNote: note } : { adminNote: note };
      const res = await fetch(`/api/admin/deposits/${selected.id}/${action}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.data?.message);
      setSelected(null);
      fetchDeposits();
    } catch { toast.error('Action failed'); }
    finally { setActing(false); }
  };

  const pending = deposits.filter(d => d.status === 'pending').length;

  return (
    <AdminLayout>
      {/* Screenshot Lightbox */}
      {lightbox && selected && (
        <div className="modal-overlay" style={{ zIndex:2000 }} onClick={() => setLightbox(false)}>
          <img src={selected.screenshotPath} alt="Screenshot" style={{ maxWidth:'90vw',maxHeight:'90vh',borderRadius:12,objectFit:'contain' }} onClick={e=>e.stopPropagation()} />
        </div>
      )}

      {/* Detail Modal */}
      {selected && !lightbox && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:560 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <h3 style={{ fontSize:18,fontWeight:700 }}>Deposit #{selected.id.slice(-8)}</h3>
              <button onClick={() => setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,background:'var(--bg-secondary)',borderRadius:10,padding:14,marginBottom:16,fontSize:13 }}>
              <span style={{ color:'var(--text-muted)' }}>User</span><span style={{ fontWeight:600 }}>@{selected.username}</span>
              <span style={{ color:'var(--text-muted)' }}>Email</span><span>{selected.email}</span>
              <span style={{ color:'var(--text-muted)' }}>Submitted</span><span>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}</span>
              <span style={{ color:'var(--text-muted)' }}>Network</span><span><span className="badge badge-blue">{selected.network}</span></span>
              <span style={{ color:'var(--text-muted)' }}>Claimed Amount</span><span style={{ fontWeight:700,color:'var(--accent-blue)' }}>${selected.amountClaimed.toFixed(2)}</span>
              {selected.txNote && <><span style={{ color:'var(--text-muted)' }}>TX Note</span><span style={{ fontSize:11,wordBreak:'break-all' }}>{selected.txNote}</span></>}
            </div>
            {/* Screenshot */}
            <div style={{ position:'relative',marginBottom:16 }}>
              <img src={selected.screenshotPath} alt="Proof" style={{ width:'100%',borderRadius:10,maxHeight:260,objectFit:'cover',cursor:'zoom-in' }} onClick={() => setLightbox(true)} />
              <button onClick={() => setLightbox(true)} style={{ position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.6)',border:'none',borderRadius:6,padding:'4px 8px',color:'white',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12 }}><ZoomIn size={12}/>Zoom</button>
            </div>

            {selected.status === 'pending' ? (
              <>
                <div style={{ marginBottom:12 }}>
                  <label className="input-label">Approved Amount (USDT)</label>
                  <input className="input" type="number" value={approvedAmt} onChange={e=>setApprovedAmt(e.target.value)} />
                  <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:4 }}>You can adjust this if the claimed amount differs from what was sent</p>
                </div>
                <div style={{ marginBottom:16 }}>
                  <label className="input-label">Admin Note (optional for approval, required for rejection)</label>
                  <textarea className="input" rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Leave a note..." style={{ resize:'vertical' }} />
                </div>
                <div style={{ display:'flex',gap:10 }}>
                  <button className="btn btn-green" style={{ flex:1 }} onClick={() => doAction('approve')} disabled={acting}>
                    {acting ? <span className="spinner"/> : '✓ Approve & Credit'}
                  </button>
                  <button className="btn btn-red" style={{ flex:1 }} onClick={() => doAction('cancel')} disabled={acting}>
                    {acting ? <span className="spinner"/> : '✕ Cancel & Reject'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center',padding:'12px',background:'var(--bg-secondary)',borderRadius:10 }}>
                <span className={`badge ${selected.status==='approved'?'badge-green':'badge-red'}`} style={{ fontSize:14,padding:'6px 16px' }}>{selected.status.toUpperCase()}</span>
                {selected.adminNote && <p style={{ marginTop:8,fontSize:13,color:'var(--text-muted)' }}>Note: {selected.adminNote}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding:28 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4 }}>Deposit Requests</h1>
            {pending > 0 && <div style={{ display:'flex',alignItems:'center',gap:6,color:'var(--accent-yellow)',fontSize:13,fontWeight:600 }}><Clock size={13}/>{pending} pending review{pending>1?'s':''}</div>}
          </div>
        </div>
        <div className="tab-bar" style={{ marginBottom:20,maxWidth:400 }}>
          {['all','pending','approved','cancelled'].map(f => <button key={f} className={`tab ${filter===f?'active':''}`} onClick={() => setFilter(f)} style={{ textTransform:'capitalize' }}>{f}</button>)}
        </div>
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          {loading ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>Loading...</div> :
           deposits.length === 0 ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>No deposits found.</div> :
           <table style={{ width:'100%' }}>
             <thead><tr><th>#</th><th>User</th><th>Claimed</th><th>Network</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
             <tbody>
               {deposits.map((d, i) => (
                 <tr key={d.id} style={{ borderLeft: d.status==='pending' ? '3px solid var(--accent-yellow)' : '3px solid transparent' }}>
                   <td style={{ color:'var(--text-muted)',fontSize:12 }}>{i+1}</td>
                   <td><div style={{ fontWeight:600 }}>@{d.username}</div><div style={{ fontSize:11,color:'var(--text-muted)' }}>{d.email}</div></td>
                   <td style={{ fontWeight:700,color:'var(--accent-blue)' }}>${d.amountClaimed.toFixed(2)}</td>
                   <td><span className="badge badge-blue">{d.network}</span></td>
                   <td style={{ fontSize:12,color:'var(--text-muted)' }}>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</td>
                   <td><span className={`badge ${d.status==='approved'?'badge-green':d.status==='cancelled'?'badge-red':'badge-yellow'}`}>{d.status}</span></td>
                   <td><button className="btn btn-outline btn-sm" onClick={() => openModal(d)}><Eye size={12}/>Review</button></td>
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
