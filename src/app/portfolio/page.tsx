'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, LogOut, Wallet, BarChart2, ArrowUpDown } from 'lucide-react';

function Navbar({ user }: { user: { username: string; role: string; usdtBalance: number } | null }) {
  const router = useRouter();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };
  return (
    <nav className="navbar" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>₿</div>
        <span style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CryptoTrade Pro</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {([['Dashboard','/dashboard'],['Portfolio','/portfolio'],['Deposit','/deposit'],['Withdraw','/withdraw']] as [string,string][]).map(([l,h])=>(
          <Link key={h} href={h} style={{ padding:'6px 12px', borderRadius:6, fontSize:13, fontWeight:500, color: h==='/portfolio' ? 'var(--accent-blue)' : 'var(--text-secondary)', textDecoration:'none', background: h==='/portfolio' ? 'rgba(59,130,246,0.1)' : 'transparent' }}>{l}</Link>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {user?.role==='admin' && <Link href="/admin" style={{ fontSize:12, color:'var(--accent-purple)', textDecoration:'none', fontWeight:600 }}>Admin</Link>}
        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{user?.username}</span>
        <button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={13}/>Logout</button>
      </div>
    </nav>
  );
}

interface Holding { symbol: string; quantity: number; avgBuy: number; }
interface PortfolioData { usdtBalance: number; holdings: Holding[]; }
interface Order { id: string; symbol: string; side: string; quantity: number; price: number; total: number; status: string; createdAt: number; }

export default function Portfolio() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string; usdtBalance: number } | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) { router.push('/login'); return; } r.json().then(d => setUser(d.data)); });
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([fetch('/api/portfolio'), fetch('/api/orders')]);
      const pData = await pRes.json();
      const oData = await oRes.json();
      if (pRes.ok) setPortfolio(pData.data);
      if (oRes.ok) setOrders(oData.data || []);

      // Fetch current prices for holdings
      const holdings: Holding[] = pData.data?.holdings || [];
      if (holdings.length > 0) {
        const syms = holdings.map(h => `"${h.symbol}USDT"`).join(',');
        const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=[${syms}]`);
        const priceData: { symbol: string; price: string }[] = await priceRes.json();
        const map: Record<string, number> = {};
        priceData.forEach(p => { map[p.symbol.replace('USDT', '')] = parseFloat(p.price); });
        setPrices(map);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalHoldingsValue = (portfolio?.holdings || []).reduce((sum, h) => sum + (h.quantity * (prices[h.symbol] || 0)), 0);
  const totalValue = (portfolio?.usdtBalance || 0) + totalHoldingsValue;
  const totalPnl = (portfolio?.holdings || []).reduce((sum, h) => sum + (h.quantity * ((prices[h.symbol] || 0) - h.avgBuy)), 0);

  const coinColors: Record<string, string> = { BTC:'#f7931a',ETH:'#627eea',BNB:'#f3ba2f',SOL:'#9945ff',XRP:'#00aae4',ADA:'#0033ad',DOGE:'#c2a633',AVAX:'#e84142' };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      <Navbar user={user} />
      <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>
        <h1 style={{ fontSize:24, fontWeight:800, marginBottom:24 }}>My Portfolio</h1>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          <div className="stat-card">
            <div className="stat-label"><Wallet size={12} style={{ display:'inline', marginRight:4 }}/>USDT Balance</div>
            <div className="stat-value" style={{ color:'var(--accent-blue)' }}>${(portfolio?.usdtBalance||0).toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><BarChart2 size={12} style={{ display:'inline', marginRight:4 }}/>Total Portfolio Value</div>
            <div className="stat-value" style={{ color:'var(--text-primary)' }}>${totalValue.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{totalPnl>=0?<TrendingUp size={12} style={{ display:'inline', marginRight:4 }}/>:<TrendingDown size={12} style={{ display:'inline', marginRight:4 }}/>}Unrealized P&L</div>
            <div className="stat-value" style={{ color: totalPnl>=0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {totalPnl>=0?'+':''}{totalPnl.toLocaleString(undefined,{maximumFractionDigits:2})} USDT
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="card" style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Holdings</h2>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</div> :
           (portfolio?.holdings||[]).filter(h=>h.quantity>0.000001).length === 0 ?
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
              <BarChart2 size={40} style={{ margin:'0 auto 12px', opacity:0.3, display:'block' }}/>
              No holdings yet. <Link href="/dashboard" style={{ color:'var(--accent-blue)' }}>Start trading!</Link>
            </div> :
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Asset</th><th>Quantity</th><th>Avg Buy</th><th>Current Price</th><th>Value</th><th>P&L</th><th>P&L %</th>
                </tr></thead>
                <tbody>
                  {(portfolio?.holdings||[]).filter(h=>h.quantity>0.000001).map(h => {
                    const curPrice = prices[h.symbol] || 0;
                    const value = h.quantity * curPrice;
                    const pnl = h.quantity * (curPrice - h.avgBuy);
                    const pnlPct = h.avgBuy > 0 ? ((curPrice - h.avgBuy) / h.avgBuy) * 100 : 0;
                    return (
                      <tr key={h.symbol}>
                        <td><div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28,height:28,borderRadius:'50%',background:coinColors[h.symbol]||'var(--accent-blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'white' }}>{h.symbol.slice(0,3)}</div>
                          <span style={{ fontWeight:700 }}>{h.symbol}/USDT</span>
                        </div></td>
                        <td>{h.quantity.toFixed(6)}</td>
                        <td>${h.avgBuy.toLocaleString(undefined,{maximumFractionDigits:4})}</td>
                        <td>${curPrice.toLocaleString(undefined,{maximumFractionDigits:4})}</td>
                        <td style={{ fontWeight:600 }}>${value.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                        <td style={{ color: pnl>=0?'var(--accent-green)':'var(--accent-red)', fontWeight:600 }}>{pnl>=0?'+':''}{pnl.toFixed(2)}</td>
                        <td style={{ color: pnlPct>=0?'var(--accent-green)':'var(--accent-red)', fontWeight:600 }}>{pnlPct>=0?'+':''}{pnlPct.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>

        {/* Trade History */}
        <div className="card">
          <h2 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}><ArrowUpDown size={16} style={{ display:'inline', marginRight:6 }}/>Trade History</h2>
          {orders.length === 0 ?
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No trades yet.</div> :
            <div className="table-container">
              <table>
                <thead><tr><th>Date</th><th>Pair</th><th>Side</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {[...orders].reverse().map(o => (
                    <tr key={o.id}>
                      <td style={{ color:'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight:600 }}>{o.symbol}</td>
                      <td><span className={`badge ${o.side==='buy'?'badge-green':'badge-red'}`}>{o.side.toUpperCase()}</span></td>
                      <td>{o.quantity.toFixed(6)}</td>
                      <td>${o.price.toLocaleString(undefined,{maximumFractionDigits:4})}</td>
                      <td style={{ fontWeight:600 }}>${o.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
