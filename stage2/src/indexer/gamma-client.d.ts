/**
 * Gamma API 客户端
 *
 * Polymarket Gamma API 文档: https://docs.polymarket.com/
 */
import type { GammaEvent, GammaMarket } from '../types/index.js';
/**
 * 获取事件详情
 *
 * @param slug - 事件 slug
 * @returns 事件信息
 *
 * @example
 * ```typescript
 * const event = await getEvent('will-there-be-another-us-government-shutdown-by-january-31');
 * console.log(event.title);
 * ```
 */
export declare function getEvent(slug: string): Promise<GammaEvent>;
/**
 * 获取事件下的所有市场
 *
 * @param eventSlug - 事件 slug
 * @returns 市场列表
 *
 * @example
 * ```typescript
 * const markets = await getEventMarkets('presidential-election-2024');
 * console.log(`找到 ${markets.length} 个市场`);
 * ```
 */
export declare function getEventMarkets(eventSlug: string): Promise<GammaMarket[]>;
/**
 * 获取单个市场详情
 *
 * @param conditionId - 市场的 conditionId
 * @returns 市场信息
 */
export declare function getMarketByConditionId(conditionId: string): Promise<GammaMarket | null>;
/**
 * 获取所有活跃市场
 *
 * @param limit - 限制返回数量（可选）
 * @returns 市场列表
 *
 * @example
 * ```typescript
 * const markets = await getAllMarkets(100);
 * console.log(`找到 ${markets.length} 个活跃市场`);
 * ```
 */
export declare function getAllMarkets(limit?: number): Promise<GammaMarket[]>;
/**
 * 搜索市场
 *
 * @param query - 搜索关键词
 * @returns 匹配的市场列表
 */
export declare function searchMarkets(query: string): Promise<GammaMarket[]>;
/**
 * 从 Gamma Market 数据中提取 Oracle 地址
 *
 * 注意：Gamma API 可能不直接提供 oracle 字段，
 * 但可以从其他字段推断或使用默认值
 *
 * @param market - Gamma 市场数据
 * @returns Oracle 地址
 */
export declare function extractOracleAddress(market: GammaMarket): string;
/**
 * 验证 Gamma Market 数据的完整性
 *
 * @param market - Gamma 市场数据
 * @returns 是否有效
 */
export declare function validateGammaMarket(market: GammaMarket): boolean;
//# sourceMappingURL=gamma-client.d.ts.map