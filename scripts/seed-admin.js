#!/usr/bin/env node
/**
 * Admin Seeder Script
 * Run: node scripts/seed-admin.js
 * Creates a default admin account if none exists.
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'crypto-trade.db'));
db.pragma('foreign_keys = ON');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cryptotrade.pro';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function seed() {
  console.log('🔧 Seeding admin account...');

  // Check if admin exists
  const existing = db.prepare('SELECT * FROM users WHERE email = ? OR role = ?').get(ADMIN_EMAIL, 'admin');
  if (existing) {
    console.log(`✅ Admin already exists: ${existing.email} (username: ${existing.username})`);
    db.close();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const id = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, role, usdt_balance, is_active, created_at, last_login_at)
    VALUES (?, ?, ?, ?, 'admin', 0, 1, ?, ?)
  `).run(id, ADMIN_EMAIL, ADMIN_USERNAME, passwordHash, now, now);

  console.log('');
  console.log('✅ Admin account created!');
  console.log('─────────────────────────────');
  console.log(`📧 Email:    ${ADMIN_EMAIL}`);
  console.log(`👤 Username: ${ADMIN_USERNAME}`);
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
  console.log('─────────────────────────────');
  console.log('⚠️  Change the password after first login!');
  console.log('');

  db.close();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
