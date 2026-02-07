/**
 * 数据库表结构定义和初始化
 */

import type Database from 'better-sqlite3';

/**
 * 创建所有数据库表
 */
export function createTables(db: Database.Database): void {
  // 创建 events 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT,
      description TEXT,
      neg_risk INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 创建 markets 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      slug TEXT UNIQUE NOT NULL,
      condition_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      oracle TEXT NOT NULL,
      collateral_token TEXT NOT NULL,
      yes_token_id TEXT NOT NULL,
      no_token_id TEXT NOT NULL,
      enable_neg_risk INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  // 创建 trades 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      log_index INTEGER NOT NULL,
      block_number INTEGER NOT NULL,
      block_hash TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      maker TEXT NOT NULL,
      taker TEXT NOT NULL,
      side TEXT NOT NULL,
      outcome TEXT NOT NULL,
      token_id TEXT NOT NULL,
      price TEXT NOT NULL,
      size TEXT NOT NULL,
      maker_asset_id TEXT NOT NULL,
      taker_asset_id TEXT NOT NULL,
      maker_amount TEXT NOT NULL,
      taker_amount TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (market_id) REFERENCES markets(id),
      UNIQUE(tx_hash, log_index)
    )
  `);

  // 创建 sync_state 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      last_block INTEGER NOT NULL,
      last_block_hash TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('✓ 数据库表创建成功');
}

/**
 * 创建所有索引以优化查询性能
 */
export function createIndexes(db: Database.Database): void {
  // markets 表索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_markets_condition_id 
    ON markets(condition_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_markets_yes_token 
    ON markets(yes_token_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_markets_no_token 
    ON markets(no_token_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_markets_event_id 
    ON markets(event_id)
  `);

  // trades 表索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trades_market_id 
    ON trades(market_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trades_block_number 
    ON trades(block_number)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trades_timestamp 
    ON trades(timestamp)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trades_token_id 
    ON trades(token_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trades_tx_hash 
    ON trades(tx_hash)
  `);

  console.log('✓ 数据库索引创建成功');
}

/**
 * 初始化数据库结构
 */
export function initializeDatabase(db: Database.Database): void {
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 创建表
  createTables(db);
  
  // 创建索引
  createIndexes(db);
}

/**
 * 删除所有表（用于测试或重置）
 */
export function dropAllTables(db: Database.Database): void {
  db.exec(`DROP TABLE IF EXISTS trades`);
  db.exec(`DROP TABLE IF EXISTS markets`);
  db.exec(`DROP TABLE IF EXISTS events`);
  db.exec(`DROP TABLE IF EXISTS sync_state`);
  
  console.log('✓ 所有表已删除');
}

/**
 * 重置数据库（删除所有表并重新创建）
 */
export function resetDatabase(db: Database.Database): void {
  dropAllTables(db);
  initializeDatabase(db);
  
  console.log('✓ 数据库已重置');
}
