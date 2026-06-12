import { db } from './index';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

export async function migrate() {
  // Create tables if they don't exist
  db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      usdt_balance REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER,
      last_login_at INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'market',
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'filled',
      created_at INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      symbol TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      avg_buy REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount_claimed REAL NOT NULL,
      network TEXT NOT NULL,
      screenshot_path TEXT NOT NULL,
      tx_note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      amount_approved REAL,
      admin_note TEXT,
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at INTEGER,
      created_at INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      network TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      tx_hash TEXT,
      admin_note TEXT,
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at INTEGER,
      created_at INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS wallet_config (
      id TEXT PRIMARY KEY,
      network TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER,
      updated_by TEXT REFERENCES users(id)
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS trading_pairs (
      symbol TEXT PRIMARY KEY,
      base_asset TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      min_qty REAL NOT NULL DEFAULT 0.001
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER
    )
  `);

  // Seed default trading pairs
  const pairs = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL' },
    { symbol: 'XRPUSDT', baseAsset: 'XRP' },
    { symbol: 'ADAUSDT', baseAsset: 'ADA' },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE' },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX' },
  ];

  for (const pair of pairs) {
    db.run(sql`
      INSERT OR IGNORE INTO trading_pairs (symbol, base_asset, is_active, min_qty)
      VALUES (${pair.symbol}, ${pair.baseAsset}, 1, 0.001)
    `);
  }

  // Seed default wallet configs
  const wallets = [
    { id: 'wc-trc20', network: 'TRC20', address: 'TYourTRC20AddressHere' },
    { id: 'wc-bep20', network: 'BEP20', address: '0xYourBEP20AddressHere' },
    { id: 'wc-erc20', network: 'ERC20', address: '0xYourERC20AddressHere' },
  ];

  for (const w of wallets) {
    db.run(sql`
      INSERT OR IGNORE INTO wallet_config (id, network, address, is_active, updated_at)
      VALUES (${w.id}, ${w.network}, ${w.address}, 1, ${Date.now()})
    `);
  }

  console.log('✅ Database migrated successfully');
}
