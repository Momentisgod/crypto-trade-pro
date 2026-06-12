# CryptoTrade Pro

A professional, real-time cryptocurrency trading platform.

## Features

- 📈 Live candlestick charts (TradingView lightweight-charts)
- ⚡ Real-time prices via Binance WebSocket
- 💰 Buy / Sell order system with portfolio tracking
- 💳 Manual USDT deposit with screenshot verification
- 💸 USDT withdrawal requests
- 🛡️ Full admin panel (user management, deposit/withdrawal review, config)
- 🔐 JWT authentication with httpOnly cookies

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: SQLite via Drizzle ORM
- **Auth**: JWT (jose) + bcryptjs
- **Charts**: TradingView lightweight-charts
- **Real-time Data**: Binance Public WebSocket API (free, no key needed)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub

[github.com/Momentisgod/crypto-trade-pro](https://github.com/Momentisgod/crypto-trade-pro)
