import type { TradeDecoded } from '../types/index.js';
/**
 * 交易解码器（任务 A）
 *
 * 给定交易哈希，解析链上交易日志，还原交易详情
 *
 * @param txHash - 交易哈希
 * @returns 交易解码结果数组（一个交易可能包含多个 OrderFilled 事件）
 *
 * @example
 * ```typescript
 * const trades = await decodeTrade('0xabc...123');
 * trades.forEach(trade => {
 *   console.log(`价格: ${trade.price} USDC`);
 *   console.log(`方向: ${trade.side}`);
 *   console.log(`TokenId: ${trade.tokenId}`);
 * });
 * ```
 */
export declare function decodeTrade(txHash: string): Promise<TradeDecoded[]>;
/**
 * 批量解码多个交易
 * @param txHashes - 交易哈希数组
 * @returns 所有交易的解码结果
 */
export declare function decodeTradesBatch(txHashes: string[]): Promise<TradeDecoded[]>;
//# sourceMappingURL=trade-decoder.d.ts.map