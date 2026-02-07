/**
 * Polymarket 链上数据解码器
 *
 * 提供交易解码和市场参数解码功能
 *
 * @packageDocumentation
 */
export { decodeTrade, decodeTradesBatch } from './decoders/trade-decoder.js';
export { decodeMarket } from './decoders/market-decoder.js';
export type { TradeDecoded, MarketDecoded, MarketDecodeParams } from './types/index.js';
export type { OrderFilledEvent } from './types/contracts.js';
export { USDC_ADDRESS, CTF_EXCHANGE_ADDRESS, NEGRISK_EXCHANGE_ADDRESS, EXCHANGE_ADDRESSES, ORDER_FILLED_ABI, USDC_DECIMALS, ZERO_BYTES32, } from './constants/index.js';
export { getCollectionId, getPositionId, toHex, isValidBytes32, isValidAddress } from './utils/hash.js';
export { publicClient, createCustomClient } from './utils/client.js';
//# sourceMappingURL=index.d.ts.map