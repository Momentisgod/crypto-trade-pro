import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id:           text('id').primaryKey(),
  email:        text('email').notNull().unique(),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role:         text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  usdtBalance:  real('usdt_balance').default(0).notNull(),
  isActive:     integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt:    integer('created_at', { mode: 'timestamp' }),
  lastLoginAt:  integer('last_login_at', { mode: 'timestamp' }),
});

export const orders = sqliteTable('orders', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  symbol:    text('symbol').notNull(),
  side:      text('side', { enum: ['buy', 'sell'] }).notNull(),
  type:      text('type', { enum: ['market', 'limit'] }).default('market').notNull(),
  quantity:  real('quantity').notNull(),
  price:     real('price').notNull(),
  total:     real('total').notNull(),
  status:    text('status', { enum: ['pending', 'filled', 'cancelled'] }).default('filled').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const portfolio = sqliteTable('portfolio', {
  id:       text('id').primaryKey(),
  userId:   text('user_id').notNull().references(() => users.id),
  symbol:   text('symbol').notNull(),
  quantity: real('quantity').default(0).notNull(),
  avgBuy:   real('avg_buy').default(0).notNull(),
});

export const deposits = sqliteTable('deposits', {
  id:             text('id').primaryKey(),
  userId:         text('user_id').notNull().references(() => users.id),
  amountClaimed:  real('amount_claimed').notNull(),
  network:        text('network', { enum: ['TRC20', 'ERC20', 'BEP20'] }).notNull(),
  screenshotPath: text('screenshot_path').notNull(),
  txNote:         text('tx_note'),
  status:         text('status', { enum: ['pending', 'approved', 'cancelled'] }).default('pending').notNull(),
  amountApproved: real('amount_approved'),
  adminNote:      text('admin_note'),
  reviewedBy:     text('reviewed_by').references(() => users.id),
  reviewedAt:     integer('reviewed_at', { mode: 'timestamp' }),
  createdAt:      integer('created_at', { mode: 'timestamp' }),
});

export const withdrawals = sqliteTable('withdrawals', {
  id:            text('id').primaryKey(),
  userId:        text('user_id').notNull().references(() => users.id),
  amount:        real('amount').notNull(),
  network:       text('network', { enum: ['TRC20', 'ERC20', 'BEP20'] }).notNull(),
  walletAddress: text('wallet_address').notNull(),
  status:        text('status', { enum: ['pending', 'processed', 'cancelled'] }).default('pending').notNull(),
  txHash:        text('tx_hash'),
  adminNote:     text('admin_note'),
  reviewedBy:    text('reviewed_by').references(() => users.id),
  reviewedAt:    integer('reviewed_at', { mode: 'timestamp' }),
  createdAt:     integer('created_at', { mode: 'timestamp' }),
});

export const walletConfig = sqliteTable('wallet_config', {
  id:        text('id').primaryKey(),
  network:   text('network', { enum: ['TRC20', 'ERC20', 'BEP20'] }).notNull().unique(),
  address:   text('address').notNull(),
  isActive:  integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  updatedBy: text('updated_by').references(() => users.id),
});

export const tradingPairs = sqliteTable('trading_pairs', {
  symbol:    text('symbol').primaryKey(),
  baseAsset: text('base_asset').notNull(),
  isActive:  integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  minQty:    real('min_qty').default(0.001).notNull(),
});

export const refreshTokens = sqliteTable('refresh_tokens', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  token:     text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});
