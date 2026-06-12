'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { toast } from 'sonner';
import { Edit2, Check, X } from 'lucide-react';

const NETWORKS = ['TRC20','ERC20','BEP20'] as const;
type Network = typeof NETWORKS[number];

interface WalletConfig { id: string; network: Network; address: string; isActive: boolean; }

export default function AdminConfig() {
  const [configs, setConfigs] = useState<WalletConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Network | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = () => {
    fetch('/api/admin/wallet-config').then(r => r.json()).then(d => { setConfigs(d.data||[]); setLoading(false); });
  };
  useEffect(() => { fetchConfigs(); }, []);

  const startEdit = (c: WalletConfig) => { setEditing(c.network); setEditAddress(c.address); setEditActive(c.isActive); };

  const save = async (network: Network) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/wallet-config', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ network, address: editAddress, isActive: editActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`${network} wallet updated!`);
      setEditing(null);
      fetchConfigs();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const networkColors: Record<Network, string> = { TRC20:'#e84142', ERC20:'#627eea', BEP20:'#f3ba2f' };

  return (
    <AdminLayout>
      <div style={{ padding:28 }}>
        <h1 style={{ fontSize:24,fontWeight:800,marginBottom:8 }}>Platform Configuration</h1>
        <p style={{ color:'var(--text-secondary)',marginBottom:28 }}>Manage deposit wallet addresses for each network.</p>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:32 }}>
          {NETWORKS.map(network => {
            const config = configs.find(c => c.network === network);
            const isEditing = editing === network;
            const color = networkColors[network];
            return (
              <div key={network} className="card" style={{ borderTop:`3px solid ${color}` }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
                  <div>
                    <span style={{ fontWeight:800,fontSize:17,color }}>{network}</span>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>USDT Network</div>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background: config?.isActive ? 'var(--accent-green)' : 'var(--accent-red)' }}/>
                    <span style={{ fontSize:12,color:'var(--text-muted)' }}>{config?.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>

                {isEditing ? (
                  <>
                    <input className="input" value={editAddress} onChange={e=>setEditAddress(e.target.value)} placeholder="Wallet address" style={{ marginBottom:10,fontSize:12 }} />
                    <div className="tab-bar" style={{ marginBottom:12 }}>
                      <button className={`tab ${editActive?'active':''}`} onClick={()=>setEditActive(true)}>Active</button>
                      <button className={`tab ${!editActive?'active':''}`} onClick={()=>setEditActive(false)}>Inactive</button>
                    </div>
                    <div style={{ display:'flex',gap:8 }}>
                      <button className="btn btn-green btn-sm" style={{ flex:1 }} onClick={() => save(network)} disabled={saving}>
                        {saving ? <span className="spinner" style={{ width:12,height:12 }}/> : <><Check size={12}/>Save</>}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}><X size={12}/></button>
                    </div>
                  </>
                ) : (
                  <>
                    {loading ? <div style={{ height:36,background:'var(--bg-secondary)',borderRadius:8,marginBottom:12 }}/> :
                     <code style={{ display:'block',fontSize:11,background:'var(--bg-secondary)',borderRadius:8,padding:'8px 10px',wordBreak:'break-all',color:'var(--text-secondary)',marginBottom:12,minHeight:40 }}>
                       {config?.address || <span style={{ color:'var(--text-muted)' }}>No address set</span>}
                     </code>
                    }
                    <button className="btn btn-outline btn-sm" style={{ width:'100%' }} onClick={() => config && startEdit(config)}>
                      <Edit2 size={12}/>Edit Address
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Trading Pairs Info */}
        <div className="card">
          <h3 style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Supported Trading Pairs</h3>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12 }}>
            {['BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT','XRP/USDT','ADA/USDT','DOGE/USDT','AVAX/USDT'].map(pair => (
              <div key={pair} style={{ background:'var(--bg-secondary)',borderRadius:8,padding:'10px 14px',display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--accent-green)',flexShrink:0 }}/>
                <span style={{ fontSize:13,fontWeight:600 }}>{pair}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
