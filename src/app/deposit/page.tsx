'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Copy, Check, Upload, X, AlertTriangle, LogOut, Clock } from 'lucide-react';

function Navbar({ user }: { user: { username: string; role: string } | null }) {
  const router = useRouter();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };
  return (
    <nav className="navbar" style={{ justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28,height:28,borderRadius:6,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800 }}>₿</div>
        <span style={{ fontWeight:800,fontSize:16,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>CryptoTrade Pro</span>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {([['Dashboard','/dashboard'],['Portfolio','/portfolio'],['Deposit','/deposit'],['Withdraw','/withdraw']] as [string,string][]).map(([l,h])=>(
          <Link key={h} href={h} style={{ padding:'6px 12px',borderRadius:6,fontSize:13,fontWeight:500,color:h==='/deposit'?'var(--accent-blue)':'var(--text-secondary)',textDecoration:'none',background:h==='/deposit'?'rgba(59,130,246,0.1)':'transparent' }}>{l}</Link>
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

const NETWORKS = ['TRC20','ERC20','BEP20'] as const;
type Network = typeof NETWORKS[number];

interface WalletConfig { network: Network; address: string; isActive: boolean; }

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [network, setNetwork] = useState<Network>('TRC20');
  const [configs, setConfigs] = useState<WalletConfig[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) { router.push('/login'); return; } r.json().then(d => setUser(d.data)); });
    fetch('/api/deposit').then(r => r.json()).then(d => setConfigs(d.data || []));
  }, [router]);

  const activeConfig = configs.find(c => c.network === network && c.isActive);
  const address = activeConfig?.address || '';

  // Generate QR code
  useEffect(() => {
    if (!address) { setQrDataUrl(''); return; }
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(address, { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        .then(setQrDataUrl);
    });
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied!');
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!amount || parseFloat(amount) < 10) { toast.error('Minimum deposit is 10 USDT'); return; }
    if (!file) { toast.error('Please upload a screenshot'); return; }
    if (!address) { toast.error('This network is not available. Please contact support.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('amountClaimed', amount);
      fd.append('network', network);
      fd.append('txNote', txNote);
      fd.append('screenshot', file);
      const res = await fetch('/api/deposit', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setSubmitted(true);
      toast.success('Deposit request submitted!');
    } catch { toast.error('Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      <Navbar user={user} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:20 }}>
        <div style={{ width:80,height:80,borderRadius:'50%',background:'rgba(16,185,129,0.15)',border:'2px solid var(--accent-green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36 }}>✓</div>
        <h2 style={{ fontSize:24,fontWeight:800,color:'var(--accent-green)' }}>Request Submitted!</h2>
        <p style={{ color:'var(--text-secondary)',textAlign:'center',maxWidth:400 }}>Your deposit of <strong style={{ color:'var(--text-primary)' }}>{amount} USDT</strong> via <strong style={{ color:'var(--text-primary)' }}>{network}</strong> is pending admin review. Usually processed within 1–2 hours.</p>
        <div style={{ display:'flex',gap:12 }}>
          <Link href="/deposit/history" className="btn btn-primary">View History</Link>
          <button className="btn btn-outline" onClick={() => { setSubmitted(false); setAmount(''); setTxNote(''); setFile(null); setPreview(''); }}>New Deposit</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      <Navbar user={user} />
      <div style={{ padding:24, maxWidth:600, margin:'0 auto' }}>
        <h1 style={{ fontSize:24,fontWeight:800,marginBottom:8 }}>Deposit USDT</h1>
        <p style={{ color:'var(--text-secondary)',marginBottom:24 }}>Send USDT to the address below, then submit your proof of payment.</p>

        {/* Network Selector */}
        <div className="tab-bar" style={{ marginBottom:24 }}>
          {NETWORKS.map(n => <button key={n} className={`tab ${network===n?'active':''}`} onClick={() => setNetwork(n)}>{n}</button>)}
        </div>

        {!activeConfig ? (
          <div className="card" style={{ textAlign:'center',padding:40,color:'var(--text-muted)' }}>
            <AlertTriangle size={32} style={{ margin:'0 auto 12px',display:'block',color:'var(--accent-yellow)' }} />
            {network} network is currently unavailable. Please try another network or contact support.
          </div>
        ) : (
          <>
            {/* QR & Address */}
            <div className="card" style={{ textAlign:'center',marginBottom:16 }}>
              <p style={{ fontSize:12,color:'var(--text-muted)',marginBottom:16,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em' }}>Send USDT ({network}) to this address</p>
              {qrDataUrl && <div className="qr-container" style={{ display:'inline-flex',marginBottom:20 }}><img src={qrDataUrl} alt="Deposit QR Code" width={180} height={180} /></div>}
              <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--bg-secondary)',borderRadius:10,padding:'10px 14px',marginBottom:12 }}>
                <code style={{ flex:1,fontSize:12,wordBreak:'break-all',textAlign:'left',color:'var(--text-primary)' }}>{address}</code>
                <button className="btn btn-outline btn-sm" onClick={copyAddress} style={{ flexShrink:0 }}>
                  {copied ? <><Check size={12} style={{ color:'var(--accent-green)' }}/> Copied</> : <><Copy size={12}/> Copy</>}
                </button>
              </div>
              <div style={{ background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:8,padding:'10px 14px',textAlign:'left' }}>
                <p style={{ fontSize:12,color:'var(--accent-yellow)',fontWeight:600 }}><AlertTriangle size={12} style={{ display:'inline',marginRight:4 }}/>Only send USDT ({network}) to this address. Sending any other coin or using the wrong network will result in permanent loss of funds.</p>
              </div>
              <p style={{ fontSize:12,color:'var(--text-muted)',marginTop:10 }}>Minimum deposit: <strong style={{ color:'var(--text-primary)' }}>10 USDT</strong></p>
            </div>

            {/* Submit proof */}
            <div className="card">
              <h3 style={{ fontSize:15,fontWeight:700,marginBottom:16,paddingBottom:12,borderBottom:'1px solid var(--border)' }}>Submit Proof of Payment</h3>
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                <div>
                  <label className="input-label">Amount Sent (USDT) *</label>
                  <input className="input" type="number" min="10" placeholder="e.g. 100" value={amount} onChange={e=>setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Transaction Hash / Note (Optional)</label>
                  <input className="input" placeholder="Paste TX hash or note" value={txNote} onChange={e=>setTxNote(e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Screenshot of Transaction *</label>
                  <div
                    className={`file-upload-area ${dragging?'dragover':''}`}
                    onDragOver={e=>{e.preventDefault();setDragging(true)}}
                    onDragLeave={()=>setDragging(false)}
                    onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])}}
                    onClick={()=>fileRef.current?.click()}
                  >
                    {preview ? (
                      <div style={{ position:'relative' }}>
                        <img src={preview} alt="Preview" style={{ maxHeight:200,maxWidth:'100%',borderRadius:8 }} />
                        <button onClick={e=>{e.stopPropagation();setFile(null);setPreview('');}} style={{ position:'absolute',top:-8,right:-8,width:24,height:24,borderRadius:'50%',background:'var(--accent-red)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}><X size={12}/></button>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} style={{ margin:'0 auto 8px',display:'block',color:'var(--text-muted)' }}/>
                        <p style={{ color:'var(--text-secondary)',fontSize:14 }}>Drag & drop or <span style={{ color:'var(--accent-blue)' }}>browse</span></p>
                        <p style={{ color:'var(--text-muted)',fontSize:12 }}>JPG, PNG, WEBP — max 10MB</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={e=>{if(e.target.files?.[0]) handleFile(e.target.files[0])}} />
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width:'100%' }} onClick={submit} disabled={submitting}>
                  {submitting ? <span className="spinner"/> : <><Upload size={16}/>Submit Deposit Request</>}
                </button>
                <p style={{ fontSize:12,color:'var(--text-muted)',textAlign:'center' }}><Clock size={11} style={{ display:'inline',marginRight:4 }}/>Processing time: Usually within 1–2 hours</p>
              </div>
            </div>
          </>
        )}

        <div style={{ textAlign:'center',marginTop:16 }}>
          <Link href="/deposit/history" style={{ color:'var(--accent-blue)',fontSize:14 }}>View deposit history →</Link>
        </div>
      </div>
    </div>
  );
}
