/**
 * 数据库连接管理
 */

import Database from 'better-sqlite3';
import { initializeDatabase } from './schema.js';
import * as path from 'path';
import * as fs from 'fs';

// 全局数据库实例
let dbInstance: Database.Database | null = null;

/**
 * 获取或创建数据库连接
 */
export function getDatabase(dbPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath = dbPath || process.env.DB_PATH || './data/indexer.db';
  
  // 确保数据库目录存在
  const dbDir = path.dirname(resolvedPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 创建数据库连接
  dbInstance = new Database(resolvedPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

  // 初始化数据库结构
  initializeDatabase(dbInstance);

  console.log(`✓ 数据库连接成功: ${resolvedPath}`);

  return dbInstance;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('✓ 数据库连接已关闭');
  }
}

/**
 * 创建新的数据库连接（用于测试）
 */
export function createDatabase(dbPath: string): Database.Database {
  // 确保数据库目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  initializeDatabase(db);

  return db;
}

/**
 * 重置全局数据库实例
 */
export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = null;
}
