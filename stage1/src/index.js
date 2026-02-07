/**
 * Polymarket 链上数据解码器
 *
 * 提供交易解码和市场参数解码功能
 *
 * @packageDocumentation
 */
// 导出解码器函数
export { decodeTrade, decodeTradesBatch } from './decoders/trade-decoder.js';
export { decodeMarket } from './decoders/market-decoder.js';
// 导出常量
export { USDC_ADDRESS, CTF_EXCHANGE_ADDRESS, NEGRISK_EXCHANGE_ADDRESS, EXCHANGE_ADDRESSES, ORDER_FILLED_ABI, USDC_DECIMALS, ZERO_BYTES32, } from './constants/index.js';
// 导出工具函数
export { getCollectionId, getPositionId, toHex, isValidBytes32, isValidAddress } from './utils/hash.js';
export { publicClient, createCustomClient } from './utils/client.js';
//# sourceMappingURL=index.js.map