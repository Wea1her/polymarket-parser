/**
 * Trade Indexer / Trade Sync
 *
 * 扫描链上交易日志，解码 OrderFilled 事件，并存储到数据库
 */
import type Database from 'better-sqlite3';
import type { SyncResult } from '../types/index.js';
/**
 * 主索引器函数：扫描指定区块范围的交易
 */
export declare function runIndexer(db: Database.Database, fromBlock?: bigint, toBlock?: bigint): Promise<SyncResult>;
/**
 * 清空区块缓存（用于测试或内存管理）
 */
export declare function clearBlockCache(): void;
//# sourceMappingURL=trade-sync.d.ts.map