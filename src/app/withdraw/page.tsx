'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { LogOut, AlertTriangle, Clock, X, ArrowDownToLine } from 'lucide-react';

function Navbar({ user }: { user: { username: string; role: string; usdtBalance: number } | null }) {
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
          <Link key={h} href={h} style={{ padding:'6px 12px',borderRadius:6,fontSize:13,fontWeight:500,color:h==='/withdraw'?'var(--accent-blue)':'var(--text-secondary)',textDecoration:'none',background:h==='/withdraw'?'rgba(59,130,246,0.1)':'transparent' }}>{l}</Link>
        ))}
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        {user?.role==='admin' && <Link href="/admin" style={{ fontSize:12,color:'var(--accent-purple)',textDecoration:'none',fontWeight:600 }}>Admin</Link>}
        <span style={{ fontSize:13,color:'var(--text-secondary)' }}>{user?.username}</span>
        <button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={13}/>Logout</button>
      </div>
    </nav>
  );
}

type Network = 'TRC20' | 'ERC20' | 'BEP20';
interface Withdrawal { id: string; amount: number; network: string; walletAddress: string; status: string; txHash: string | null; adminNote: string | null; createdAt: number; }

export default function WithdrawPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string; usdtBalance: number } | null>(null);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [network, setNetwork] = useState<Network>('TRC20');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const fetchData = () => {
    fetch('/api/auth/me').then(r => { if (!r.ok) { router.push('/login'); return; } r.json().then(d => setUser(d.data)); });
    fetch('/api/portfolio').then(r => r.json()).then(d => setUsdtBalance(d.data?.usdtBalance || 0));
    fetch('/api/withdraw').then(r => r.json()).then(d => setHistory(d.data || []));
  };

  useEffect(() => { fetchData(); }, [router]);

  const submit = async () => {
    setConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), network, walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Withdrawal request submitted!');
      setAmount(''); setAddress('');
      fetchData();
    } catch { toast.error('Request failed'); }
    finally { setSubmitting(false); }
  };

  const canSubmit = parseFloat(amount) >= 10 && parseFloat(amount) <= usdtBalance && address.length >= 10;

  const statusBadge = (s: string) => {
    if (s === 'processed') return <span className="badge badge-green">✓ Processed</span>;
    if (s === 'cancelled') return <span className="badge badge-red">✕ Cancelled</span>;
    return <span className="badge badge-yellow"><Clock size={10} style={{ display:'inline',marginRight:3 }}/>Pending</span>;
  };

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-primary)' }}>
      <Navbar user={user} />

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:420 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <div style={{ width:40,height:40,borderRadius:'50%',background:'rgba(245,158,11,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}><AlertTriangle size={20} color="var(--accent-yellow)"/></div>
              <h3 style={{ fontSize:18,fontWeight:700 }}>Confirm Withdrawal</h3>
            </div>
            <div style={{ background:'var(--bg-secondary)',borderRadius:10,padding:16,marginBottom:16 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13 }}>
                <div style={{ color:'var(--text-muted)' }}>Amount</div><div style={{ fontWeight:700,color:'var(--accent-red)' }}>{amount} USDT</div>
                <div style={{ color:'var(--text-muted)' }}>Network</div><div style={{ fontWeight:600 }}>{network}</div>
                <div style={{ color:'var(--text-muted)' }}>To Address</div><div style={{ fontWeight:600,fontSize:11,wordBreak:'break-all',color:'var(--text-secondary)' }}>{address}</div>
              </div>
            </div>
            <p style={{ fontSize:12,color:'var(--accent-yellow)',marginBottom:20 }}>⚠️ Please double-check the address. We cannot recover funds sent to the wrong address.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setConfirmModal(false)}>Cancel</button>
              <button className="btn btn-red" style={{ flex:1 }} onClick={submit} disabled={submitting}>
                {submitting ? <span className="spinner"/> : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:24,maxWidth:650,margin:'0 auto' }}>
        <h1 style={{ fontSize:24,fontWeight:800,marginBottom:8 }}>Withdraw USDT</h1>
        <p style={{ color:'var(--text-secondary)',marginBottom:24 }}>Withdraw your USDT balance to your external wallet.</p>

        {/* Balance */}
        <div className="stat-card" style={{ marginBottom:24,background:'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.1))',border:'1px solid rgba(59,130,246,0.3)' }}>
          <div className="stat-label">Available Balance</div>
          <div className="stat-value" style={{ color:'var(--accent-blue)' }}>${usdtBalance.toFixed(2)} <span style={{ fontSize:16,color:'var(--text-muted)' }}>USDT</span></div>
        </div>

        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Withdrawal Details</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {/* Network */}
            <div>
              <label className="input-label">Network</label>
              <div className="tab-bar">
                {(['TRC20','ERC20','BEP20'] as Network[]).map(n => <button key={n} className={`tab ${network===n?'active':''}`} onClick={() => setNetwork(n)}>{n}</button>)}
              </div>
            </div>
            {/* Amount */}
            <div>
              <label className="input-label">Amount (USDT)</label>
              <div style={{ position:'relative' }}>
                <input className="input" type="number" min="10" max={usdtBalance} placeholder="Minimum 10 USDT" value={amount} onChange={e => setAmount(e.target.value)} />
                <button onClick={() => setAmount(usdtBalance.toFixed(2))} style={{ position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--accent-blue)',background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>MAX</button>
              </div>
              {parseFloat(amount) > usdtBalance && <p style={{ fontSize:11,color:'var(--accent-red)',marginTop:4 }}>Exceeds available balance</p>}
            </div>
            {/* Wallet Address */}
            <div>
              <label className="input-label">Your {network} Wallet Address</label>
              <input className="input" placeholder="Enter your wallet address" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            {/* Info */}
            <div style={{ background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'10px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12 }}>
              <div style={{ color:'var(--text-muted)' }}>Processing Fee</div><div style={{ fontWeight:600,color:'var(--accent-green)' }}>Free</div>
              <div style={{ color:'var(--text-muted)' }}>Processing Time</div><div style={{ fontWeight:600 }}>Within 24 hours</div>
              <div style={{ color:'var(--text-muted)' }}>Minimum</div><div style={{ fontWeight:600 }}>10 USDT</div>
            </div>
            <button className="btn btn-red btn-lg" style={{ width:'100%' }} onClick={() => setConfirmModal(true)} disabled={!canSubmit}>
              <ArrowDownToLine size={16}/>Withdraw {amount || '0'} USDT
            </button>
          </div>
        </div>

        {/* History */}
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14 }}>Withdrawal History</div>
          {history.length === 0 ?
            <div style={{ textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:14 }}>No withdrawal requests yet.</div> :
            <table style={{ width:'100%' }}>
              <thead><tr><th>Date</th><th>Amount</th><th>Network</th><th>Address</th><th>Status</th><th>TX Hash</th></tr></thead>
              <tbody>
                {history.map(w => (
                  <tr key={w.id}>
                    <td style={{ color:'var(--text-muted)',fontSize:12 }}>{w.createdAt ? new Date(w.createdAt).toLocaleString() : '-'}</td>
                    <td style={{ fontWeight:700,color:'var(--accent-red)' }}>${w.amount.toFixed(2)}</td>
                    <td><span className="badge badge-blue">{w.network}</span></td>
                    <td style={{ fontSize:11,color:'var(--text-muted)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{w.walletAddress}</td>
                    <td>{statusBadge(w.status)}</td>
                    <td style={{ fontSize:11,color:'var(--text-muted)' }}>{w.txHash ? w.txHash.slice(0,16)+'...' : '-'}</td>
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
