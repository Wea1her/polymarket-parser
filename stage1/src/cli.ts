#!/usr/bin/env node

/**
 * Polymarket 解码器 CLI 工具
 * 
 * 支持命令：
 * - decode-trade: 解码交易
 * - decode-market: 解码市场参数
 */

import { Command } from 'commander';
import { decodeTrade } from './decoders/trade-decoder.js';
import { decodeMarket } from './decoders/market-decoder.js';

const program = new Command();

program
  .name('polymarket-cli')
  .description('Polymarket 链上数据解码器 CLI 工具')
  .version('1.0.0');

// 解码交易命令
program
  .command('decode-trade')
  .description('解码交易，提取 OrderFilled 事件详情')
  .requiredOption('-t, --tx <hash>', '交易哈希（以 0x 开头）')
  .option('-p, --pretty', '格式化输出 JSON', false)
  .action(async (options) => {
    try {
      console.log(`正在解码交易: ${options.tx}...`);
      const trades = await decodeTrade(options.tx);
      
      console.log(`\n找到 ${trades.length} 个 OrderFilled 事件:\n`);
      
      if (options.pretty) {
        console.log(JSON.stringify(trades, null, 2));
      } else {
        console.log(JSON.stringify(trades));
      }
      
      // 输出简要统计
      console.log(`\n统计信息:`);
      console.log(`- 总交易数: ${trades.length}`);
      console.log(`- BUY 交易: ${trades.filter(t => t.side === 'BUY').length}`);
      console.log(`- SELL 交易: ${trades.filter(t => t.side === 'SELL').length}`);
      
    } catch (error) {
      console.error('❌ 解码失败:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// 解码市场命令
program
  .command('decode-market')
  .description('解码市场参数，计算 YES/NO TokenId')
  .requiredOption('-c, --condition-id <id>', '条件 ID (bytes32, 以 0x 开头)')
  .requiredOption('-q, --question-id <id>', '问题 ID (bytes32, 以 0x 开头)')
  .requiredOption('-o, --oracle <address>', '预言机地址 (以 0x 开头)')
  .option('-p, --pretty', '格式化输出 JSON', false)
  .action((options) => {
    try {
      console.log('正在解码市场参数...\n');
      
      const market = decodeMarket({
        conditionId: options.conditionId,
        questionId: options.questionId,
        oracle: options.oracle,
      });
      
      if (options.pretty) {
        console.log(JSON.stringify(market, null, 2));
      } else {
        console.log(JSON.stringify(market));
      }
      
      // 输出详细信息
      console.log('\n市场信息:');
      console.log(`- Condition ID: ${market.conditionId}`);
      console.log(`- Question ID: ${market.questionId}`);
      console.log(`- Oracle: ${market.oracle}`);
      console.log(`- Collateral: ${market.collateralToken}`);
      console.log(`\n头寸 TokenId:`);
      console.log(`- YES: ${market.yesTokenId}`);
      console.log(`- NO:  ${market.noTokenId}`);
      
    } catch (error) {
      console.error('❌ 解码失败:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// 示例命令
program
  .command('examples')
  .description('显示使用示例')
  .action(() => {
    console.log(`
Polymarket 解码器使用示例:

1. 解码交易:
   $ pnpm cli decode-trade --tx 0xabc...123
   $ pnpm cli decode-trade --tx 0xabc...123 --pretty

2. 解码市场:
   $ pnpm cli decode-market \\
     --condition-id 0xdef...456 \\
     --question-id 0x789...abc \\
     --oracle 0x123...oracle \\
     --pretty

3. 获取帮助:
   $ pnpm cli --help
   $ pnpm cli decode-trade --help
   $ pnpm cli decode-market --help

环境变量配置:
  在项目根目录创建 .env 文件，设置:
  POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
    `);
  });

// 解析命令行参数
program.parse();

