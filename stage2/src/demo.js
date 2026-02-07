/**
 * Demo 演示脚本（验收用）
 *
 * 符合 stage2 文档中的验收命令规范
 */
import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from 'dotenv';
import { createDatabase } from './db/connection.js';
import { discoverMarkets } from './indexer/market-discovery.js';
import { runIndexer } from './indexer/trade-sync.js';
import { getSampleTrades, getMarketBySlug } from './db/store.js';
import { publicClient } from '../../stage1/src/utils/client.js';
// 加载环境变量
config();
const program = new Command();
program
    .name('polymarket-demo')
    .description('Polymarket 索引器演示脚本')
    .option('--tx-hash <hash>', '示例交易哈希')
    .option('--event-slug <slug>', '事件 slug')
    .option('--from-block <number>', '起始区块', (val) => BigInt(val))
    .option('--to-block <number>', '结束区块', (val) => BigInt(val))
    .option('--db <path>', '数据库路径', './data/demo_indexer.db')
    .option('--reset-db', '重置数据库')
    .option('--output <path>', '输出文件路径')
    .parse();
/**
 * 主函数
 */
async function main() {
    const opts = program.opts();
    console.log('=== Polymarket 索引器演示 ===\n');
    console.log('配置选项:', opts, '\n');
    let db;
    try {
        // 1. 初始化数据库
        if (opts.resetDb) {
            console.log('重置数据库...');
            // 如果文件存在，先删除
            try {
                await fs.unlink(opts.db);
                console.log('✓ 删除旧数据库文件');
            }
            catch (err) {
                // 文件不存在，忽略错误
            }
        }
        // 确保数据目录存在
        const dbDir = path.dirname(opts.db);
        await fs.mkdir(dbDir, { recursive: true });
        db = createDatabase(opts.db);
        console.log(`✓ 数据库初始化成功: ${opts.db}\n`);
        // 2. Market Discovery（如果指定了 event-slug）
        if (opts.eventSlug) {
            console.log('=== 任务 A: Market Discovery ===\n');
            await discoverMarkets(db, opts.eventSlug);
        }
        // 3. Trade Indexer
        console.log('=== 任务 B: Trade Indexer ===\n');
        let fromBlock;
        let toBlock;
        if (opts.txHash) {
            // 根据交易哈希获取区块号
            console.log(`获取交易信息: ${opts.txHash}`);
            const tx = await publicClient.getTransaction({ hash: opts.txHash });
            fromBlock = toBlock = tx.blockNumber;
            console.log(`✓ 交易所在区块: ${fromBlock}\n`);
        }
        else if (opts.fromBlock && opts.toBlock) {
            fromBlock = opts.fromBlock;
            toBlock = opts.toBlock;
        }
        else {
            throw new Error('必须指定 --tx-hash 或 (--from-block 和 --to-block)');
        }
        // 运行索引器
        const result = await runIndexer(db, fromBlock, toBlock);
        console.log('=== 索引结果 ===');
        console.log(`插入交易数: ${result.totalTrades}`);
        console.log(`处理区块数: ${result.processedBlocks}`);
        console.log(`区块范围: ${result.fromBlock} - ${result.toBlock}`);
        // 4. 生成输出
        if (opts.output) {
            console.log(`\n生成输出文件: ${opts.output}`);
            // 获取示例交易
            const sampleTrades = getSampleTrades(db, 5);
            // 获取市场信息（如果指定了 event-slug）
            let marketSlug;
            let marketId;
            if (opts.eventSlug) {
                const market = getMarketBySlug(db, opts.eventSlug);
                if (market) {
                    marketSlug = market.slug;
                    marketId = market.id;
                }
            }
            // 构造输出对象（符合文档规范）
            const output = {
                stage2: {
                    from_block: Number(fromBlock),
                    to_block: Number(toBlock),
                    inserted_trades: result.totalTrades,
                    market_slug: marketSlug || opts.eventSlug,
                    market_id: marketId,
                    sample_trades: sampleTrades.map((trade) => ({
                        tx_hash: trade.tx_hash,
                        log_index: trade.log_index,
                        block_number: trade.block_number,
                        timestamp: trade.timestamp,
                        side: trade.side,
                        outcome: trade.outcome,
                        price: trade.price,
                        size: trade.size,
                        token_id: trade.token_id,
                    })),
                    db_path: opts.db,
                },
            };
            // 确保输出目录存在
            const outputDir = path.dirname(opts.output);
            await fs.mkdir(outputDir, { recursive: true });
            // 写入文件
            await fs.writeFile(opts.output, JSON.stringify(output, null, 2));
            console.log(`✓ 输出文件已生成: ${opts.output}`);
        }
        console.log('\n=== 演示完成 ===\n');
    }
    catch (error) {
        console.error('\n✗ 错误:', error);
        process.exit(1);
    }
    finally {
        // 关闭数据库连接
        if (db) {
            db.close();
        }
    }
}
// 运行主函数
main().catch((err) => {
    console.error('致命错误:', err);
    process.exit(1);
});
//# sourceMappingURL=demo.js.map