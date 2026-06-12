'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Clock, Image as ImageIcon, X } from 'lucide-react';

function Navbar({ user }: { user: { username: string; role: string } | null }) {
  const router = useRouter();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };
  return (
    <nav className="navbar" style={{ justifyContent:'space-between' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
        <div style={{ width:28,height:28,borderRadius:6,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800 }}>₿</div>
        <span style={{ fontWeight:800,fontSize:16,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>CryptoTrade Pro</span>
      </div>
      <div style={{ display:'flex',gap:4 }}>
        {([['Dashboard','/dashboard'],['Portfolio','/portfolio'],['Deposit','/deposit'],['Withdraw','/withdraw']] as [string,string][]).map(([l,h])=>(
          <Link key={h} href={h} style={{ padding:'6px 12px',borderRadius:6,fontSize:13,fontWeight:500,color:'var(--text-secondary)',textDecoration:'none' }}>{l}</Link>
        ))}
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <span style={{ fontSize:13,color:'var(--text-secondary)' }}>{user?.username}</span>
        <button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={13}/>Logout</button>
      </div>
    </nav>
  );
}

interface Deposit { id: string; amountClaimed: number; amountApproved: number | null; network: string; status: string; screenshotPath: string; txNote: string | null; adminNote: string | null; createdAt: number; }

export default function DepositHistory() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) { router.push('/login'); return; } r.json().then(d => setUser(d.data)); });
    fetch('/api/deposit/history').then(r => r.json()).then(d => { setDeposits(d.data || []); setLoading(false); });
  }, [router]);

  const statusBadge = (s: string) => {
    if (s === 'approved') return <span className="badge badge-green">✓ Approved</span>;
    if (s === 'cancelled') return <span className="badge badge-red">✕ Cancelled</span>;
    return <span className="badge badge-yellow"><Clock size={10} style={{ display:'inline',marginRight:3 }}/>Pending</span>;
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      <Navbar user={user} />
      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          <div style={{ maxWidth:'90vw',maxHeight:'90vh',position:'relative' }}>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute',top:-12,right:-12,width:28,height:28,borderRadius:'50%',background:'var(--bg-card)',border:'1px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-primary)',zIndex:10 }}><X size={14}/></button>
            <img src={lightbox} alt="Screenshot" style={{ maxWidth:'90vw',maxHeight:'90vh',borderRadius:12,objectFit:'contain' }} />
          </div>
        </div>
      )}
      <div style={{ padding:24, maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
          <h1 style={{ fontSize:24,fontWeight:800 }}>Deposit History</h1>
          <Link href="/deposit" className="btn btn-primary btn-sm">+ New Deposit</Link>
        </div>
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          {loading ? <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>Loading...</div> :
           deposits.length === 0 ?
            <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>
              <Clock size={40} style={{ margin:'0 auto 12px',display:'block',opacity:0.3 }}/>
              No deposit requests yet. <Link href="/deposit" style={{ color:'var(--accent-blue)' }}>Make your first deposit!</Link>
            </div> :
            <table style={{ width:'100%' }}>
              <thead><tr>
                <th>Date</th><th>Network</th><th>Claimed</th><th>Approved</th><th>Status</th><th>Note</th><th>Screenshot</th>
              </tr></thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id}>
                    <td style={{ color:'var(--text-muted)',fontSize:12 }}>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</td>
                    <td><span className="badge badge-blue">{d.network}</span></td>
                    <td style={{ fontWeight:600 }}>${d.amountClaimed.toFixed(2)}</td>
                    <td style={{ color:'var(--accent-green)',fontWeight:600 }}>{d.amountApproved ? `$${d.amountApproved.toFixed(2)}` : '-'}</td>
                    <td>{statusBadge(d.status)}</td>
                    <td style={{ maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12,color:'var(--text-muted)' }}>{d.adminNote || d.txNote || '-'}</td>
                    <td>
                      <button onClick={() => setLightbox(d.screenshotPath)} style={{ background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',cursor:'pointer',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4,fontSize:12 }}>
                        <ImageIcon size={12}/>View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}
