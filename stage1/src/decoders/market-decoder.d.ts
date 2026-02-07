import type { Address, Hex } from 'viem';
import type { MarketDecoded, MarketDecodeParams } from '../types/index.js';
/**
 * 市场解码器（任务 B）
 *
 * 根据 conditionId、questionId、oracle 等信息，计算市场的 YES 和 NO 头寸的 TokenId
 *
 * @param params - 市场参数
 * @param params.conditionId - 条件 ID
 * @param params.questionId - 问题 ID
 * @param params.oracle - 预言机地址
 * @param collateralToken - 抵押品代币地址（默认为 USDC）
 * @returns 市场解码结果，包含 YES 和 NO 的 TokenId
 *
 * @example
 * ```typescript
 * const market = decodeMarket({
 *   conditionId: '0xabc...123',
 *   questionId: '0xdef...456',
 *   oracle: '0x789...oracle'
 * });
 * console.log(market.yesTokenId); // YES 头寸的 TokenId
 * console.log(market.noTokenId);  // NO 头寸的 TokenId
 * ```
 */
export declare function decodeMarket(params: MarketDecodeParams, collateralToken?: Address): MarketDecoded;
/**
 * 从 YES 或 NO TokenId 反向计算 CollectionId
 * （辅助函数，用于调试和验证）
 */
export declare function getCollectionIdFromTokenId(tokenId: Hex, collateralToken?: Address): string;
//# sourceMappingURL=market-decoder.d.ts.map