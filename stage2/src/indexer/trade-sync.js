/**
 * Trade Indexer / Trade Sync
 *
 * 扫描链上交易日志，解码 OrderFilled 事件，并存储到数据库
 */
import { publicClient } from '../../../stage1/src/utils/client.js';
import { EXCHANGE_ADDRESSES, ORDER_FILLED_ABI, USDC_DECIMALS, } from '../../../stage1/src/constants/index.js';
import { decodeEventLog, formatUnits } from 'viem';
import * as store from '../db/store.js';
import { retryWithBackoff } from '../utils/retry.js';
// 区块信息缓存（避免重复查询）
const blockCache = new Map();
/**
 * 获取区块信息（带缓存）
 */
async function getBlockInfo(blockNumber) {
    if (blockCache.has(blockNumber)) {
        return blockCache.get(blockNumber);
    }
    const block = await publicClient.getBlock({ blockNumber });
    const info = {
        timestamp: block.timestamp,
        hash: block.hash,
    };
    blockCache.set(blockNumber, info);
    return info;
}
/**
 * 获取指定区块范围的 OrderFilled 日志
 */
async function fetchOrderFilledLogs(fromBlock, toBlock) {
    console.log(`  获取日志: 区块 ${fromBlock} - ${toBlock}`);
    const logs = await publicClient.getLogs({
        address: EXCHANGE_ADDRESSES,
        event: ORDER_FILLED_ABI[0], // OrderFilled 事件
        fromBlock,
        toBlock,
    });
    console.log(`  ✓ 找到 ${logs.length} 条日志`);
    return logs;
}
/**
 * 解码单个 OrderFilled 日志
 */
function decodeOrderFilledLog(log, txHash) {
    const decoded = decodeEventLog({
        abi: ORDER_FILLED_ABI,
        data: log.data,
        topics: log.topics,
    });
    const args = decoded.args;
    // 判断哪个是 USDC，哪个是 Outcome Token
    const makerIsUSDC = args.makerAssetId === 0n;
    const takerIsUSDC = args.takerAssetId === 0n;
    // 确定 tokenId（非零的 assetId）
    let tokenId;
    if (makerIsUSDC && !takerIsUSDC) {
        tokenId = `0x${args.takerAssetId.toString(16).padStart(64, '0')}`;
    }
    else if (!makerIsUSDC && takerIsUSDC) {
        tokenId = `0x${args.makerAssetId.toString(16).padStart(64, '0')}`;
    }
    else if (!makerIsUSDC && !takerIsUSDC) {
        // 两边都是头寸代币（复杂交易）
        tokenId = `0x${args.takerAssetId.toString(16).padStart(64, '0')}`;
    }
    else {
        throw new Error('无效的 OrderFilled 事件：两边都是 USDC');
    }
    // 计算价格
    let price;
    let usdcAmount;
    let tokenAmount;
    if (makerIsUSDC) {
        usdcAmount = args.makerAmountFilled;
        tokenAmount = args.takerAmountFilled;
    }
    else {
        usdcAmount = args.takerAmountFilled;
        tokenAmount = args.makerAmountFilled;
    }
    if (tokenAmount === 0n) {
        price = '0';
    }
    else {
        const priceRaw = (usdcAmount * 10n ** 6n) / tokenAmount;
        price = formatUnits(priceRaw, USDC_DECIMALS);
    }
    // 判断买卖方向
    const side = makerIsUSDC ? 'BUY' : 'SELL';
    return {
        maker: args.maker,
        taker: args.taker,
        makerAssetId: args.makerAssetId,
        takerAssetId: args.takerAssetId,
        makerAmountFilled: args.makerAmountFilled,
        takerAmountFilled: args.takerAmountFilled,
        price,
        tokenId,
        side,
    };
}
/**
 * 计算交易的 size（头寸数量）
 */
function calculateSize(makerAssetId, takerAssetId, makerAmountFilled, takerAmountFilled) {
    // tokenAmount 是头寸的数量
    const tokenAmount = makerAssetId === 0n ? takerAmountFilled : makerAmountFilled;
    // 头寸代币也是 6 位小数
    return formatUnits(tokenAmount, 6);
}
/**
 * 处理交易日志并转换为数据库记录
 */
async function processTradeLogs(db, logs) {
    const trades = [];
    for (const log of logs) {
        try {
            const txHash = log.transactionHash;
            const decoded = decodeOrderFilledLog(log, txHash);
            // 通过 tokenId 查找市场
            let market = store.findMarketByTokenId(db, decoded.tokenId);
            if (!market) {
                // 动态发现市场
                console.warn(`  ⚠ 未知市场 tokenId: ${decoded.tokenId.slice(0, 10)}...`);
                // 尝试通过推断 conditionId 来发现市场
                // 注意：这里需要更复杂的逻辑来从 tokenId 反推 conditionId
                // 暂时跳过未知市场的交易
                console.warn(`  跳过未知市场的交易: ${txHash}:${log.logIndex}`);
                continue;
            }
            // 确定 outcome (YES/NO)
            const outcome = decoded.tokenId.toLowerCase() === market.yes_token_id.toLowerCase()
                ? 'YES'
                : 'NO';
            // 获取区块信息
            const blockInfo = await getBlockInfo(BigInt(log.blockNumber));
            // 计算 size
            const size = calculateSize(decoded.makerAssetId, decoded.takerAssetId, decoded.makerAmountFilled, decoded.takerAmountFilled);
            // 构造交易记录
            trades.push({
                market_id: market.id,
                tx_hash: txHash,
                log_index: Number(log.logIndex),
                block_number: Number(log.blockNumber),
                block_hash: blockInfo.hash,
                timestamp: new Date(Number(blockInfo.timestamp) * 1000).toISOString(),
                maker: decoded.maker,
                taker: decoded.taker,
                side: decoded.side,
                outcome,
                token_id: decoded.tokenId,
                price: decoded.price,
                size,
                maker_asset_id: decoded.makerAssetId.toString(),
                taker_asset_id: decoded.takerAssetId.toString(),
                maker_amount: decoded.makerAmountFilled.toString(),
                taker_amount: decoded.takerAmountFilled.toString(),
            });
        }
        catch (error) {
            console.error(`  处理日志失败 (tx: ${log.transactionHash}, logIndex: ${log.logIndex}):`, error);
        }
    }
    return trades;
}
/**
 * 主索引器函数：扫描指定区块范围的交易
 */
export async function runIndexer(db, fromBlock, toBlock) {
    console.log('\n=== 开始交易索引 ===\n');
    // 读取上次同步状态
    const syncState = store.getSyncState(db, 'trade_sync');
    const startBlock = fromBlock ??
        BigInt(syncState?.last_block ?? process.env.DEFAULT_START_BLOCK ?? 40000000);
    const currentBlock = await publicClient.getBlockNumber();
    const endBlock = toBlock ?? currentBlock;
    console.log(`起始区块: ${startBlock}`);
    console.log(`结束区块: ${endBlock}`);
    console.log(`区块范围: ${endBlock - startBlock + 1n} 个区块\n`);
    // 分批次处理（每次 10000 区块）
    const BATCH_SIZE = 10000n;
    let currentBatchStart = startBlock;
    let totalTrades = 0;
    const errors = [];
    while (currentBatchStart <= endBlock) {
        const batchEnd = currentBatchStart + BATCH_SIZE - 1n > endBlock
            ? endBlock
            : currentBatchStart + BATCH_SIZE - 1n;
        console.log(`\n批次: 区块 ${currentBatchStart} - ${batchEnd} (${batchEnd - currentBatchStart + 1n} 个区块)`);
        try {
            // 使用重试机制获取日志
            const logs = await retryWithBackoff(() => fetchOrderFilledLogs(currentBatchStart, batchEnd), 3, 2000);
            // 处理日志
            const trades = await processTradeLogs(db, logs);
            // 批量插入数据库（带事务）
            const inserted = store.insertTrades(db, trades);
            console.log(`  ✓ 插入 ${inserted} 条交易记录（总共 ${trades.length} 条）`);
            totalTrades += inserted;
            // 更新同步状态
            store.updateSyncState(db, {
                key: 'trade_sync',
                last_block: Number(batchEnd),
                last_block_hash: null,
                updated_at: new Date().toISOString(),
            });
        }
        catch (error) {
            const errorMsg = `处理区块 ${currentBatchStart}-${batchEnd} 失败: ${error}`;
            console.error(`  ✗ ${errorMsg}`);
            errors.push(errorMsg);
            // 继续处理下一批次（或者选择中断）
            // throw error; // 如果想要在错误时中断，取消注释这行
        }
        currentBatchStart = batchEnd + 1n;
    }
    console.log(`\n=== 交易索引完成 ===\n` +
        `总交易数: ${totalTrades}\n` +
        `处理区块: ${endBlock - startBlock + 1n}\n` +
        `错误数: ${errors.length}\n`);
    return {
        totalTrades,
        processedBlocks: Number(endBlock - startBlock + 1n),
        fromBlock: Number(startBlock),
        toBlock: Number(endBlock),
        errors: errors.length > 0 ? errors : undefined,
    };
}
/**
 * 清空区块缓存（用于测试或内存管理）
 */
export function clearBlockCache() {
    blockCache.clear();
}
//# sourceMappingURL=trade-sync.js.map