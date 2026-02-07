/**
 * Polymarket Indexer 主导出文件
 *
 * 提供所有核心功能的统一入口
 */
export { getDatabase, closeDatabase, createDatabase } from './db/connection.js';
export { initializeDatabase, resetDatabase, createTables, createIndexes } from './db/schema.js';
export * as store from './db/store.js';
export { discoverMarkets, dynamicDiscoverMarket, discoverMultipleEvents } from './indexer/market-discovery.js';
export { runIndexer, clearBlockCache } from './indexer/trade-sync.js';
export * as gammaClient from './indexer/gamma-client.js';
export { createServer, startServer } from './api/server.js';
export { retryWithBackoff, sleep, withTimeout, batchExecute } from './utils/retry.js';
export type { EventRecord, EventInsert, MarketRecord, MarketInsert, TradeRecord, TradeInsert, SyncStateRecord, SyncStateInsert, GammaEvent, GammaMarket, SyncResult, BlockInfo, TradeFilters, TradesQueryResult, ApiEvent, ApiMarket, ApiTrade, ApiTradesResponse, } from './types/index.js';
//# sourceMappingURL=index.d.ts.map