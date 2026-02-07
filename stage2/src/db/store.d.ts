/**
 * 数据访问层（CRUD 操作）
 */
import type Database from 'better-sqlite3';
import type { EventRecord, EventInsert, MarketRecord, MarketInsert, TradeRecord, TradeInsert, SyncStateRecord, SyncStateInsert, TradeFilters, TradesQueryResult } from '../types/index.js';
/**
 * 插入或更新事件
 */
export declare function upsertEvent(db: Database.Database, event: EventInsert): number;
/**
 * 根据 slug 获取事件
 */
export declare function getEventBySlug(db: Database.Database, slug: string): EventRecord | null;
/**
 * 获取所有事件
 */
export declare function getAllEvents(db: Database.Database): EventRecord[];
/**
 * 插入或更新市场
 */
export declare function upsertMarket(db: Database.Database, market: MarketInsert): number;
/**
 * 根据 slug 获取市场
 */
export declare function getMarketBySlug(db: Database.Database, slug: string): MarketRecord | null;
/**
 * 根据 tokenId 查找市场（可能是 yes 或 no）
 */
export declare function findMarketByTokenId(db: Database.Database, tokenId: string): MarketRecord | null;
/**
 * 根据 conditionId 获取市场
 */
export declare function getMarketByConditionId(db: Database.Database, conditionId: string): MarketRecord | null;
/**
 * 获取事件下的所有市场
 */
export declare function getMarketsByEventId(db: Database.Database, eventId: number): MarketRecord[];
/**
 * 获取所有市场
 */
export declare function getAllMarkets(db: Database.Database): MarketRecord[];
/**
 * 插入单个交易（幂等）
 */
export declare function insertTrade(db: Database.Database, trade: TradeInsert): number | null;
/**
 * 批量插入交易（使用事务）
 */
export declare function insertTrades(db: Database.Database, trades: TradeInsert[]): number;
/**
 * 获取市场的交易记录（带过滤和分页）
 */
export declare function getTradesForMarket(db: Database.Database, marketId: number, filters?: TradeFilters): TradesQueryResult;
/**
 * 根据 tokenId 获取交易记录
 */
export declare function getTradesByTokenId(db: Database.Database, tokenId: string, filters?: TradeFilters): TradesQueryResult;
/**
 * 获取示例交易（用于演示）
 */
export declare function getSampleTrades(db: Database.Database, limit?: number): TradeRecord[];
/**
 * 统计市场的交易数量
 */
export declare function getTradeCountForMarket(db: Database.Database, marketId: number): number;
/**
 * 获取同步状态
 */
export declare function getSyncState(db: Database.Database, key: string): SyncStateRecord | null;
/**
 * 更新同步状态
 */
export declare function updateSyncState(db: Database.Database, state: SyncStateInsert): void;
/**
 * 删除同步状态
 */
export declare function deleteSyncState(db: Database.Database, key: string): void;
//# sourceMappingURL=store.d.ts.map