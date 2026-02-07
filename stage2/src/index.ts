/**
 * Polymarket Indexer 主导出文件
 * 
 * 提供所有核心功能的统一入口
 */

// ============ 数据库 ============
export { getDatabase, closeDatabase, createDatabase } from './db/connection.js';
export { initializeDatabase, resetDatabase, createTables, createIndexes } from './db/schema.js';
export * as store from './db/store.js';

// ============ 索引器 ============
export { discoverMarkets, dynamicDiscoverMarket, discoverMultipleEvents } from './indexer/market-discovery.js';
export { runIndexer, clearBlockCache } from './indexer/trade-sync.js';
export * as gammaClient from './indexer/gamma-client.js';

// ============ API ============
export { createServer, startServer } from './api/server.js';

// ============ 工具 ============
export { retryWithBackoff, sleep, withTimeout, batchExecute } from './utils/retry.js';

// ============ 类型 ============
export type {
  EventRecord,
  EventInsert,
  MarketRecord,
  MarketInsert,
  TradeRecord,
  TradeInsert,
  SyncStateRecord,
  SyncStateInsert,
  GammaEvent,
  GammaMarket,
  SyncResult,
  BlockInfo,
  TradeFilters,
  TradesQueryResult,
  ApiEvent,
  ApiMarket,
  ApiTrade,
  ApiTradesResponse,
} from './types/index.js';
