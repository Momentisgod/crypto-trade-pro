'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, LogOut, User, Wallet,
  ArrowUpDown, ChevronDown, BarChart2, Activity
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserInfo { id: string; email: string; username: string; role: string; usdtBalance: number; }
interface TickerItem { symbol: string; lastPrice: string; priceChangePercent: string; }
interface PortfolioData { usdtBalance: number; holdings: { symbol: string; quantity: number; avgBuy: number }[]; }
interface OrderBookLevel { price: string; qty: string; total?: number; }

const PAIRS = [
  { symbol: 'BTCUSDT', base: 'BTC', color: '#f7931a' },
  { symbol: 'ETHUSDT', base: 'ETH', color: '#627eea' },
  { symbol: 'BNBUSDT', base: 'BNB', color: '#f3ba2f' },
  { symbol: 'SOLUSDT', base: 'SOL', color: '#9945ff' },
  { symbol: 'XRPUSDT', base: 'XRP', color: '#00aae4' },
  { symbol: 'ADAUSDT', base: 'ADA', color: '#0033ad' },
  { symbol: 'DOGEUSDT', base: 'DOGE', color: '#c2a633' },
  { symbol: 'AVAXUSDT', base: 'AVAX', color: '#e84142' },
];
const INTERVALS = ['1m','5m','15m','1h','4h','1d'];

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ user }: { user: UserInfo | null }) {
  const router = useRouter();
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };
  return (
    <nav className="navbar" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>₿</div>
        <span style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CryptoTrade Pro</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[['Dashboard','/dashboard'],['Portfolio','/portfolio'],['Deposit','/deposit'],['Withdraw','/withdraw']].map(([l,h])=>(
          <Link key={h} href={h} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: h === '/dashboard' ? 'var(--accent-blue)' : 'var(--text-secondary)', textDecoration: 'none', background: h === '/dashboard' ? 'rgba(59,130,246,0.1)' : 'transparent' }}>{l}</Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user?.role === 'admin' && <Link href="/admin" style={{ fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>Admin</Link>}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>${user?.usdtBalance?.toFixed(2) ?? '0.00'}</span>
          <span style={{ margin: '0 6px', color: 'var(--border-light)' }}>|</span>
          <span>{user?.username}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout} style={{ gap: 4 }}><LogOut size={13} />Logout</button>
      </div>
    </nav>
  );
}

// ─── Ticker Bar ───────────────────────────────────────────────────────────────
function TickerBar({ tickers }: { tickers: TickerItem[] }) {
  const items = [...tickers, ...tickers];
  return (
    <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflow: 'hidden', height: 36 }}>
      <div className="ticker-track" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {items.map((t, i) => {
          const up = parseFloat(t.priceChangePercent) >= 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.symbol.replace('USDT', '')}/USDT</span>
              <span style={{ fontWeight: 600 }}>${parseFloat(t.lastPrice).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              <span style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                {up ? '▲' : '▼'} {Math.abs(parseFloat(t.priceChangePercent)).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trading Chart ────────────────────────────────────────────────────────────
function TradingChart({ symbol, interval, setInterval: setIv, currentPrice, priceChange }: {
  symbol: string; interval: string; setInterval: (i: string) => void;
  currentPrice: number; priceChange: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null);
  const candleSeriesRef = useRef<ReturnType<ReturnType<typeof import('lightweight-charts').createChart>['addSeries']> | null>(null);
  const volSeriesRef = useRef<ReturnType<ReturnType<typeof import('lightweight-charts').createChart>['addSeries']> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    import('lightweight-charts').then(({ createChart, CandlestickSeries, HistogramSeries }) => {
      if (destroyed || !containerRef.current) return;
      if (chartRef.current) { chartRef.current.remove(); }

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 380,
        layout: { background: { color: '#141b2d' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#1e2d47' }, horzLines: { color: '#1e2d47' } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#1e2d47' },
        timeScale: { borderColor: '#1e2d47', timeVisible: true, secondsVisible: false },
      });
      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      });
      candleSeriesRef.current = candleSeries;

      const volSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a', priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      volSeriesRef.current = volSeries;

      // Fetch historical klines
      fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`)
        .then(r => r.json())
        .then((data: number[][]) => {
          if (destroyed) return;
          const candles = data.map((k) => ({ time: Math.floor(k[0] / 1000) as import('lightweight-charts').Time, open: +k[1], high: +k[2], low: +k[3], close: +k[4] }));
          const vols = data.map((k) => ({ time: Math.floor(k[0] / 1000) as import('lightweight-charts').Time, value: +k[5], color: +k[4] >= +k[1] ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)' }));
          candleSeries.setData(candles);
          volSeries.setData(vols);
          chart.timeScale().fitContent();
        });

      // WebSocket live updates
      if (wsRef.current) wsRef.current.close();
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const { k } = JSON.parse(e.data);
        if (destroyed) return;
        const candle = { time: Math.floor(k.t / 1000) as import('lightweight-charts').Time, open: +k.o, high: +k.h, low: +k.l, close: +k.c };
        const vol = { time: Math.floor(k.t / 1000) as import('lightweight-charts').Time, value: +k.v, color: +k.c >= +k.o ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)' };
        candleSeriesRef.current?.update(candle);
        volSeriesRef.current?.update(vol);
      };

      const ro = new ResizeObserver(() => {
        if (containerRef.current && !destroyed) chart.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(containerRef.current);

      return () => { ro.disconnect(); };
    });

    return () => {
      destroyed = true;
      wsRef.current?.close();
      try { chartRef.current?.remove(); } catch { /* already disposed */ }
      chartRef.current = null;
    };
  }, [symbol, interval]);

  const up = priceChange >= 0;
  return (
    <div className="chart-container">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
          <span style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600, fontSize: 14 }}>
            {up ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> : <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />}
            {up ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="tab-bar" style={{ width: 'auto' }}>
          {INTERVALS.map(iv => (
            <button key={iv} className={`tab ${interval === iv ? 'active' : ''}`} onClick={() => setIv(iv)}>{iv}</button>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}

// ─── Order Book ───────────────────────────────────────────────────────────────
function OrderBook({ symbol }: { symbol: string }) {
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const { asks: a, bids: b } = JSON.parse(e.data);
      const process = (levels: string[][]): OrderBookLevel[] => {
        const processed = levels.slice(0, 12).map(([p, q]) => ({ price: p, qty: q }));
        const maxQty = Math.max(...processed.map(l => parseFloat(l.qty)));
        return processed.map(l => ({ ...l, total: parseFloat(l.qty) / maxQty * 100 }));
      };
      setAsks(process(a).reverse());
      setBids(process(b));
    };
    return () => ws.close();
  }, [symbol]);

  const spread = asks.length && bids.length
    ? (parseFloat(asks[asks.length - 1].price) - parseFloat(bids[0].price)).toFixed(2)
    : '-';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <BarChart2 size={14} color="var(--accent-blue)" /> Order Book
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '6px 12px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
        <span>Price (USDT)</span><span style={{ textAlign: 'center' }}>Amount</span><span style={{ textAlign: 'right' }}>Total</span>
      </div>
      {/* Asks */}
      {asks.map((ask, i) => (
        <div key={i} className="ask-row" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '3px 12px', fontSize: 12 }}>
          <div className="ask-bar" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${ask.total}%`, opacity: 0.5 }} />
          <span style={{ color: 'var(--accent-red)', fontWeight: 600, zIndex: 1 }}>{parseFloat(ask.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span style={{ textAlign: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>{parseFloat(ask.qty).toFixed(4)}</span>
          <span style={{ textAlign: 'right', color: 'var(--text-muted)', zIndex: 1 }}>{(parseFloat(ask.price)*parseFloat(ask.qty)).toFixed(0)}</span>
        </div>
      ))}
      {/* Spread */}
      <div style={{ padding: '5px 12px', background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        Spread: <span style={{ color: 'var(--text-primary)' }}>${spread}</span>
      </div>
      {/* Bids */}
      {bids.map((bid, i) => (
        <div key={i} className="bid-row" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '3px 12px', fontSize: 12 }}>
          <div className="bid-bar" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${bid.total}%`, opacity: 0.5 }} />
          <span style={{ color: 'var(--accent-green)', fontWeight: 600, zIndex: 1 }}>{parseFloat(bid.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span style={{ textAlign: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>{parseFloat(bid.qty).toFixed(4)}</span>
          <span style={{ textAlign: 'right', color: 'var(--text-muted)', zIndex: 1 }}>{(parseFloat(bid.price)*parseFloat(bid.qty)).toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Recent Trades ────────────────────────────────────────────────────────────
function RecentTrades({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<{ price: string; qty: string; time: number; isBuyerMaker: boolean }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setTrades([]);
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data);
      setTrades(prev => [{ price: t.p, qty: t.q, time: t.T, isBuyerMaker: t.m }, ...prev.slice(0, 29)]);
    };
    return () => ws.close();
  }, [symbol]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity size={14} color="var(--accent-blue)" /> Recent Trades
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '6px 12px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
        <span>Price</span><span style={{ textAlign: 'center' }}>Amount</span><span style={{ textAlign: 'right' }}>Time</span>
      </div>
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {trades.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '3px 12px', fontSize: 12 }}>
            <span style={{ color: t.isBuyerMaker ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 600 }}>
              {parseFloat(t.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{parseFloat(t.qty).toFixed(4)}</span>
            <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{new Date(t.time).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trade Panel (Buy / Sell) ─────────────────────────────────────────────────
function TradePanel({ symbol, currentPrice, portfolio, onSuccess }: {
  symbol: string; currentPrice: number; portfolio: PortfolioData | null; onSuccess: () => void;
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<'market' | 'limit'>('market');
  const [qty, setQty] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const base = symbol.replace('USDT', '');
  const execPrice = type === 'market' ? currentPrice : parseFloat(limitPrice) || 0;
  const total = parseFloat(qty) * execPrice || 0;
  const usdtBal = portfolio?.usdtBalance ?? 0;
  const coinBal = portfolio?.holdings?.find(h => h.symbol === base)?.quantity ?? 0;

  const setPct = (pct: number) => {
    if (side === 'buy' && execPrice > 0) setQty(((usdtBal * pct / 100) / execPrice).toFixed(6));
    else if (side === 'sell') setQty((coinBal * pct / 100).toFixed(6));
  };

  const submit = async () => {
    if (!qty || parseFloat(qty) <= 0) { toast.error('Enter a valid quantity'); return; }
    if (type === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) { toast.error('Enter a valid limit price'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, side, type, quantity: parseFloat(qty), price: execPrice }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`${side === 'buy' ? '🟢 Bought' : '🔴 Sold'} ${qty} ${base} at $${execPrice.toLocaleString()}`);
      setQty(''); onSuccess();
    } catch { toast.error('Order failed'); }
    finally { setLoading(false); }
  };

  const isBuy = side === 'buy';
  const accent = isBuy ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Side tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <button onClick={() => setSide('buy')} style={{ padding: '12px', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', borderBottom: side === 'buy' ? '2px solid var(--accent-green)' : '2px solid var(--border)', background: side === 'buy' ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary)', color: side === 'buy' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
          BUY
        </button>
        <button onClick={() => setSide('sell')} style={{ padding: '12px', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', borderBottom: side === 'sell' ? '2px solid var(--accent-red)' : '2px solid var(--border)', background: side === 'sell' ? 'rgba(239,68,68,0.08)' : 'var(--bg-secondary)', color: side === 'sell' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
          SELL
        </button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Market/Limit */}
        <div className="tab-bar">
          <button className={`tab ${type === 'market' ? 'active' : ''}`} onClick={() => setType('market')}>Market</button>
          <button className={`tab ${type === 'limit' ? 'active' : ''}`} onClick={() => setType('limit')}>Limit</button>
        </div>

        {/* Available balance */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Available: <span style={{ color: accent, fontWeight: 700 }}>
            {isBuy ? `$${usdtBal.toFixed(2)} USDT` : `${coinBal.toFixed(6)} ${base}`}
          </span>
        </div>

        {/* Limit price */}
        {type === 'limit' && (
          <div>
            <label className="input-label">Limit Price (USDT)</label>
            <input className="input" type="number" placeholder="0.00" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} />
          </div>
        )}

        {/* Market price display */}
        {type === 'market' && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Market Price: </span>
            <span style={{ fontWeight: 700 }}>${currentPrice.toLocaleString()}</span>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="input-label">Quantity ({base})</label>
          <input className="input" type="number" placeholder="0.000000" value={qty} onChange={e => setQty(e.target.value)} />
        </div>

        {/* Percent buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[25,50,75,100].map(p => (
            <button key={p} className="pct-btn" onClick={() => setPct(p)}>{p}%</button>
          ))}
        </div>

        {/* Total */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Total: </span>
          <span style={{ fontWeight: 700 }}>${total.toFixed(2)} USDT</span>
        </div>

        {/* Submit */}
        <button className={`btn ${isBuy ? 'btn-green' : 'btn-red'}`} style={{ width: '100%', fontSize: 15 }} onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : `${isBuy ? 'Buy' : 'Sell'} ${base}`}
        </button>
      </div>
    </div>
  );
}

// ─── Symbol Selector ──────────────────────────────────────────────────────────
function SymbolSelector({ symbol, onChange }: { symbol: string; onChange: (s: string) => void }) {
  const [tickers, setTickers] = useState<Record<string, string>>({});

  useEffect(() => {
    const syms = PAIRS.map(p => `"${p.symbol}"`).join(',');
    fetch(`https://api.binance.com/api/v3/ticker/price?symbols=[${syms}]`)
      .then(r => r.json())
      .then((data: { symbol: string; price: string }[]) => {
        const map: Record<string, string> = {};
        data.forEach(d => { map[d.symbol] = d.price; });
        setTickers(map);
      });
  }, []);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>Markets</div>
      {PAIRS.map(p => (
        <button key={p.symbol} onClick={() => onChange(p.symbol)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: symbol === p.symbol ? 'rgba(59,130,246,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderLeft: symbol === p.symbol ? `3px solid ${p.color}` : '3px solid transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white' }}>{p.base.slice(0,3)}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.base}/USDT</div>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            ${tickers[p.symbol] ? parseFloat(tickers[p.symbol]).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...'}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setIntervalState] = useState('1h');
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch('/api/portfolio');
    if (res.ok) setPortfolio(await res.json().then(d => d.data));
  }, []);

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then(res => {
      if (!res.ok) { router.push('/login'); return; }
      res.json().then(d => setUser(d.data));
    });
  }, [router]);

  // Portfolio
  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  // Ticker bar data
  useEffect(() => {
    const syms = PAIRS.map(p => `"${p.symbol}"`).join(',');
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${syms}]`)
      .then(r => r.json())
      .then(setTickers);
  }, []);

  // Current symbol price via WS
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setCurrentPrice(parseFloat(d.c));
      setPriceChange(parseFloat(d.P));
    };
    return () => ws.close();
  }, [symbol]);

  const onOrderSuccess = useCallback(() => {
    fetchPortfolio();
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.data));
  }, [fetchPortfolio]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar user={user} />
      <TickerBar tickers={tickers} />

      <div style={{ padding: '16px', display: 'flex', gap: 16 }}>
        {/* Left: Chart + Bottom panels */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <TradingChart symbol={symbol} interval={interval} setInterval={setIntervalState} currentPrice={currentPrice} priceChange={priceChange} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <OrderBook symbol={symbol} />
            <RecentTrades symbol={symbol} />
          </div>
        </div>

        {/* Right: Symbol selector + Trade panel */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SymbolSelector symbol={symbol} onChange={setSymbol} />
          <TradePanel symbol={symbol} currentPrice={currentPrice} portfolio={portfolio} onSuccess={onOrderSuccess} />
        </div>
      </div>
    </div>
  );
}
