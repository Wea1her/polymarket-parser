/**
 * Market Discovery Service
 *
 * 从 Gamma API 发现市场并存储到数据库，
 * 使用 Stage1 的 decodeMarket 验证 tokenIds
 */
import type Database from 'better-sqlite3';
/**
 * 发现并保存事件下的所有市场
 *
 * @param db - 数据库连接
 * @param eventSlug - 事件 slug
 * @returns 发现的市场数量
 *
 * @example
 * ```typescript
 * const count = await discoverMarkets(db, 'presidential-election-2024');
 * console.log(`发现了 ${count} 个市场`);
 * ```
 */
export declare function discoverMarkets(db: Database.Database, eventSlug: string): Promise<number>;
/**
 * 动态发现未知市场（通过 conditionId）
 *
 * 当在交易索引过程中遇到未知的 tokenId 时，
 * 尝试通过 Gamma API 查找对应的市场
 *
 * @param db - 数据库连接
 * @param conditionId - 条件 ID
 * @returns 是否成功发现市场
 */
export declare function dynamicDiscoverMarket(db: Database.Database, conditionId: string): Promise<boolean>;
/**
 * 批量发现多个事件的市场
 *
 * @param db - 数据库连接
 * @param eventSlugs - 事件 slug 列表
 * @returns 总共发现的市场数量
 */
export declare function discoverMultipleEvents(db: Database.Database, eventSlugs: string[]): Promise<number>;
//# sourceMappingURL=market-discovery.d.ts.map