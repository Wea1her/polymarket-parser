/**
 * Gamma API 客户端
 * 
 * Polymarket Gamma API 文档: https://docs.polymarket.com/
 */

import type { GammaEvent, GammaMarket } from '../types/index.js';

const GAMMA_API_BASE =
  process.env.GAMMA_API_BASE || 'https://gamma-api.polymarket.com';

/**
 * 通用 HTTP GET 请求函数
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Gamma API 请求失败: ${response.status} ${response.statusText} - ${url}`
    );
  }

  return response.json() as Promise<T>;
}

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
export async function getEvent(slug: string): Promise<GammaEvent> {
  const url = `${GAMMA_API_BASE}/events/${slug}`;
  return fetchJson<GammaEvent>(url);
}

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
export async function getEventMarkets(eventSlug: string): Promise<GammaMarket[]> {
  // Gamma API 可能有多种端点格式，这里使用常见的格式
  // 如果事件包含市场列表，先尝试从事件中获取
  try {
    const event = await getEvent(eventSlug);
    if (event.markets && event.markets.length > 0) {
      return event.markets;
    }
  } catch (error) {
    console.warn(`无法从事件获取市场列表，尝试直接查询: ${error}`);
  }

  // 如果事件不包含市场，尝试直接查询市场端点
  const url = `${GAMMA_API_BASE}/events/${eventSlug}/markets`;
  return fetchJson<GammaMarket[]>(url);
}

/**
 * 获取单个市场详情
 * 
 * @param conditionId - 市场的 conditionId
 * @returns 市场信息
 */
export async function getMarketByConditionId(
  conditionId: string
): Promise<GammaMarket | null> {
  try {
    const url = `${GAMMA_API_BASE}/markets/${conditionId}`;
    return await fetchJson<GammaMarket>(url);
  } catch (error) {
    console.warn(`无法获取市场 ${conditionId}:`, error);
    return null;
  }
}

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
export async function getAllMarkets(limit?: number): Promise<GammaMarket[]> {
  let url = `${GAMMA_API_BASE}/markets`;
  if (limit) {
    url += `?limit=${limit}`;
  }

  try {
    return await fetchJson<GammaMarket[]>(url);
  } catch (error) {
    console.warn('获取所有市场失败:', error);
    return [];
  }
}

/**
 * 搜索市场
 * 
 * @param query - 搜索关键词
 * @returns 匹配的市场列表
 */
export async function searchMarkets(query: string): Promise<GammaMarket[]> {
  const url = `${GAMMA_API_BASE}/markets?search=${encodeURIComponent(query)}`;
  
  try {
    return await fetchJson<GammaMarket[]>(url);
  } catch (error) {
    console.warn(`搜索市场失败 (query: ${query}):`, error);
    return [];
  }
}

/**
 * 从 Gamma Market 数据中提取 Oracle 地址
 * 
 * 注意：Gamma API 可能不直接提供 oracle 字段，
 * 但可以从其他字段推断或使用默认值
 * 
 * @param market - Gamma 市场数据
 * @returns Oracle 地址
 */
export function extractOracleAddress(market: GammaMarket): string {
  // Polymarket 主要使用 UMA Adapter V2
  // 如果 API 没有提供，使用默认地址
  const UMA_ADAPTER_V2 = '0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49';
  
  // 如果 Gamma API 在未来添加 oracle 字段，可以从这里提取
  // return market.oracle || UMA_ADAPTER_V2;
  
  return UMA_ADAPTER_V2;
}

/**
 * 验证 Gamma Market 数据的完整性
 * 
 * @param market - Gamma 市场数据
 * @returns 是否有效
 */
export function validateGammaMarket(market: GammaMarket): boolean {
  // 必须有 conditionId 和 questionId
  if (!market.conditionId || !market.questionId) {
    return false;
  }

  // 必须有 clobTokenIds，且至少有 2 个
  if (!market.clobTokenIds || market.clobTokenIds.length < 2) {
    return false;
  }

  // tokenIds 必须是有效的十六进制字符串
  for (const tokenId of market.clobTokenIds) {
    if (!/^0x[0-9a-fA-F]+$/.test(tokenId)) {
      return false;
    }
  }

  return true;
}
