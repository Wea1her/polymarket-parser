import { decodeEventLog, formatUnits, type Hex, type Log } from 'viem';
import { publicClient } from '../utils/client.js';
import { ORDER_FILLED_ABI, EXCHANGE_ADDRESSES, USDC_DECIMALS } from '../constants/index.js';
import type { TradeDecoded } from '../types/index.js';
import type { OrderFilledEvent } from '../types/contracts.js';

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
export async function decodeTrade(txHash: string): Promise<TradeDecoded[]> {
  // 验证交易哈希格式
  if (!isValidTxHash(txHash)) {
    throw new Error(`无效的交易哈希: ${txHash}`);
  }

  // 获取交易回执
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash as Hex,
  });

  if (!receipt) {
    throw new Error(`未找到交易: ${txHash}`);
  }

  // 过滤出 OrderFilled 事件日志
  const orderFilledLogs = receipt.logs.filter((log) => {
    // 检查日志是否来自 Polymarket 交易所合约
    return EXCHANGE_ADDRESSES.some(
      (addr) => addr.toLowerCase() === log.address.toLowerCase()
    );
  });

  if (orderFilledLogs.length === 0) {
    throw new Error(`交易 ${txHash} 中未找到 OrderFilled 事件`);
  }

  // 解码每个 OrderFilled 日志
  const decodedTrades: TradeDecoded[] = [];

  for (const log of orderFilledLogs) {
    try {
      const decoded = decodeOrderFilledLog(log, txHash);
      decodedTrades.push(decoded);
    } catch (error) {
      console.warn(`跳过无法解码的日志 (logIndex: ${log.logIndex}):`, error);
    }
  }

  if (decodedTrades.length === 0) {
    throw new Error(`无法解码交易 ${txHash} 中的任何 OrderFilled 事件`);
  }

  return decodedTrades;
}

/**
 * 解码单个 OrderFilled 日志
 */
function decodeOrderFilledLog(log: Log, txHash: string): TradeDecoded {
  // 使用 viem 的 decodeEventLog 解码日志
  const decoded = decodeEventLog({
    abi: ORDER_FILLED_ABI,
    data: log.data,
    topics: log.topics,
  });

  const args = decoded.args as OrderFilledEvent;

  // 判断哪个是 USDC，哪个是 Outcome Token
  const makerIsUSDC = args.makerAssetId === 0n;
  const takerIsUSDC = args.takerAssetId === 0n;

  // 确定 tokenId（非零的 assetId）
  let tokenId: string;
  if (makerIsUSDC && !takerIsUSDC) {
    tokenId = `0x${args.takerAssetId.toString(16).padStart(64, '0')}`;
  } else if (!makerIsUSDC && takerIsUSDC) {
    tokenId = `0x${args.makerAssetId.toString(16).padStart(64, '0')}`;
  } else if (!makerIsUSDC && !takerIsUSDC) {
    // 两边都是头寸代币（可能是复杂的多市场交易）
    tokenId = `0x${args.takerAssetId.toString(16).padStart(64, '0')}`;
  } else {
    throw new Error('无效的 OrderFilled 事件：两边都是 USDC（assetId 都为 0）');
  }

  // 计算价格
  // price = USDC_amount / token_amount
  let price: string;
  let usdcAmount: bigint;
  let tokenAmount: bigint;

  if (makerIsUSDC) {
    // maker 出 USDC，taker 出 token
    usdcAmount = args.makerAmountFilled;
    tokenAmount = args.takerAmountFilled;
  } else {
    // taker 出 USDC，maker 出 token
    usdcAmount = args.takerAmountFilled;
    tokenAmount = args.makerAmountFilled;
  }

  // 计算价格（避免除零）
  if (tokenAmount === 0n) {
    price = '0';
  } else {
    // 使用高精度计算：先扩大分子，再除以分母，最后格式化
    // price = (usdcAmount / 10^6) / (tokenAmount / 10^6) = usdcAmount / tokenAmount
    const priceRaw = (usdcAmount * 10n ** 6n) / tokenAmount;
    price = formatUnits(priceRaw, USDC_DECIMALS);
  }

  // 判断买卖方向
  // makerAssetId === 0 表示 maker 出 USDC 买入头寸 → BUY
  // takerAssetId === 0 表示 taker 出 USDC 买入头寸，maker 卖出头寸 → SELL
  const side: "BUY" | "SELL" = makerIsUSDC ? "BUY" : "SELL";

  return {
    txHash,
    logIndex: Number(log.logIndex),
    exchange: log.address,
    maker: args.maker,
    taker: args.taker,
    makerAssetId: args.makerAssetId.toString(),
    takerAssetId: args.takerAssetId.toString(),
    makerAmountFilled: args.makerAmountFilled.toString(),
    takerAmountFilled: args.takerAmountFilled.toString(),
    price,
    tokenId,
    side,
  };
}

/**
 * 验证交易哈希格式
 */
function isValidTxHash(txHash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(txHash);
}

/**
 * 批量解码多个交易
 * @param txHashes - 交易哈希数组
 * @returns 所有交易的解码结果
 */
export async function decodeTradesBatch(txHashes: string[]): Promise<TradeDecoded[]> {
  const results = await Promise.allSettled(
    txHashes.map((hash) => decodeTrade(hash))
  );

  const allTrades: TradeDecoded[] = [];
  const errors: { hash: string; error: string }[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allTrades.push(...result.value);
    } else {
      errors.push({
        hash: txHashes[index],
        error: result.reason?.message || '未知错误',
      });
    }
  });

  if (errors.length > 0) {
    console.warn('部分交易解码失败:', errors);
  }

  return allTrades;
}

