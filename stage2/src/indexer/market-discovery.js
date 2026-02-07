/**
 * Market Discovery Service
 *
 * 从 Gamma API 发现市场并存储到数据库，
 * 使用 Stage1 的 decodeMarket 验证 tokenIds
 */
import { decodeMarket } from '../../../stage1/src/index.js';
import * as gammaClient from './gamma-client.js';
import * as store from '../db/store.js';
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
export async function discoverMarkets(db, eventSlug) {
    console.log(`\n开始发现市场: ${eventSlug}`);
    // 1. 获取事件信息
    let event;
    try {
        event = await gammaClient.getEvent(eventSlug);
    }
    catch (error) {
        console.error(`无法获取事件 ${eventSlug}:`, error);
        throw error;
    }
    console.log(`✓ 获取事件成功: ${event.title || event.slug}`);
    // 2. 保存或更新事件到数据库
    const eventId = store.upsertEvent(db, {
        slug: event.slug,
        title: event.title || null,
        description: event.description || null,
        neg_risk: event.negRisk ? 1 : 0,
    });
    console.log(`✓ 事件已保存到数据库 (ID: ${eventId})`);
    // 3. 获取事件下的所有市场
    let markets;
    try {
        markets = await gammaClient.getEventMarkets(eventSlug);
    }
    catch (error) {
        console.error(`无法获取市场列表:`, error);
        throw error;
    }
    console.log(`✓ 找到 ${markets.length} 个市场`);
    // 4. 处理每个市场
    let successCount = 0;
    let errorCount = 0;
    for (const market of markets) {
        try {
            await processMarket(db, market, eventId);
            successCount++;
        }
        catch (error) {
            errorCount++;
            console.error(`处理市场 ${market.slug} 失败:`, error);
        }
    }
    console.log(`\n✓ Market Discovery 完成: ${successCount} 成功, ${errorCount} 失败\n`);
    return successCount;
}
/**
 * 处理单个市场：验证和保存
 */
async function processMarket(db, market, eventId) {
    // 1. 验证市场数据完整性
    if (!gammaClient.validateGammaMarket(market)) {
        throw new Error(`市场数据不完整: ${market.slug}`);
    }
    // 2. 提取关键参数
    const { conditionId, questionId, clobTokenIds } = market;
    const oracle = gammaClient.extractOracleAddress(market);
    // 3. 使用 Stage1 的 decodeMarket 计算并验证 tokenIds
    let decoded;
    try {
        decoded = decodeMarket({
            conditionId,
            questionId,
            oracle,
        });
    }
    catch (error) {
        throw new Error(`解码市场失败: ${error}`);
    }
    // 4. 验证 Gamma API 返回的 tokenIds 是否与计算结果匹配
    const yesTokenMatch = decoded.yesTokenId.toLowerCase() === clobTokenIds[0].toLowerCase();
    const noTokenMatch = decoded.noTokenId.toLowerCase() === clobTokenIds[1].toLowerCase();
    if (!yesTokenMatch || !noTokenMatch) {
        console.warn(`⚠ TokenId 不匹配: ${market.slug}\n` +
            `  Gamma YES: ${clobTokenIds[0]}\n` +
            `  计算 YES: ${decoded.yesTokenId}\n` +
            `  Gamma NO:  ${clobTokenIds[1]}\n` +
            `  计算 NO:  ${decoded.noTokenId}`);
        // 注意：这里可以选择抛出错误或继续使用计算值
        // 为了健壮性，我们使用计算值并记录警告
    }
    // 5. 确定市场状态
    let status = 'active';
    if (market.closed || market.archived) {
        status = 'closed';
    }
    else if (!market.enableOrderBook || !market.acceptingOrders) {
        status = 'closed';
    }
    // 6. 保存市场到数据库
    const marketId = store.upsertMarket(db, {
        event_id: eventId,
        slug: market.slug,
        condition_id: decoded.conditionId,
        question_id: decoded.questionId,
        oracle: decoded.oracle,
        collateral_token: decoded.collateralToken,
        yes_token_id: decoded.yesTokenId,
        no_token_id: decoded.noTokenId,
        enable_neg_risk: market.negRisk ? 1 : 0,
        status,
    });
    console.log(`  ✓ 市场已保存: ${market.slug} (ID: ${marketId})`);
}
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
export async function dynamicDiscoverMarket(db, conditionId) {
    console.log(`尝试动态发现市场: ${conditionId}`);
    // 检查数据库中是否已存在
    const existing = store.getMarketByConditionId(db, conditionId);
    if (existing) {
        console.log(`市场已存在于数据库中`);
        return true;
    }
    // 尝试从 Gamma API 获取
    const market = await gammaClient.getMarketByConditionId(conditionId);
    if (!market) {
        console.warn(`Gamma API 中未找到市场: ${conditionId}`);
        return false;
    }
    // 处理并保存市场（不关联到事件）
    try {
        await processMarket(db, market, null);
        console.log(`✓ 动态发现市场成功: ${market.slug}`);
        return true;
    }
    catch (error) {
        console.error(`动态发现市场失败:`, error);
        return false;
    }
}
/**
 * 批量发现多个事件的市场
 *
 * @param db - 数据库连接
 * @param eventSlugs - 事件 slug 列表
 * @returns 总共发现的市场数量
 */
export async function discoverMultipleEvents(db, eventSlugs) {
    let totalMarkets = 0;
    for (const slug of eventSlugs) {
        try {
            const count = await discoverMarkets(db, slug);
            totalMarkets += count;
        }
        catch (error) {
            console.error(`处理事件 ${slug} 失败:`, error);
        }
    }
    return totalMarkets;
}
//# sourceMappingURL=market-discovery.js.map