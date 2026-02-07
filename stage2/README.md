# Polymarket 链上数据索引器

一个基于 TypeScript 的 Polymarket 链上数据索引系统，支持市场发现、交易同步和查询 API。

## ✨ 特性

- 🔍 **Market Discovery**（任务 A）：从 Gamma API 发现市场并验证 TokenIds
- 📊 **Trade Indexer**（任务 B）：扫描 Polygon 链上交易，解码并存储到数据库
- 🚀 **Query API**（任务 C）：提供 REST API 查询市场和交易数据
- 💾 **SQLite 数据库**：轻量级、高性能的本地数据存储
- 🔄 **断点续传**：支持中断后从上次位置继续索引
- ⚡ **幂等写入**：自动去重，支持重复运行
- 🛡️ **类型安全**：完整的 TypeScript 类型定义

## 📦 安装

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 POLYGON_RPC_URL
```

## 🚀 快速开始

### 环境配置

在 `.env` 文件中配置：

```env
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
DB_PATH=./data/indexer.db
API_PORT=8000
GAMMA_API_BASE=https://gamma-api.polymarket.com
DEFAULT_START_BLOCK=40000000
```

### 运行演示

```bash
# 使用示例交易哈希运行完整流程
pnpm demo \
  --tx-hash 0x916cad96dd5c219997638133512fd17fe7c1ce72b830157e4fd5323cf4f19946 \
  --event-slug will-there-be-another-us-government-shutdown-by-january-31 \
  --reset-db \
  --output ./data/demo_output.json

# 指定区块范围索引
pnpm demo \
  --from-block 66000000 \
  --to-block 66001000 \
  --event-slug will-there-be-another-us-government-shutdown-by-january-31 \
  --db ./data/indexer.db
```

### 启动 API 服务器

```bash
# 启动 API 服务（使用默认数据库）
pnpm api

# 或指定数据库路径和端口
pnpm api ./data/demo_indexer.db 8000
```

然后访问:
- 健康检查: http://127.0.0.1:8000/health
- API 文档: http://127.0.0.1:8000/

## 📚 API 文档

### 事件相关

#### `GET /events/:slug`

获取事件详情

```bash
curl http://127.0.0.1:8000/events/will-there-be-another-us-government-shutdown-by-january-31
```

响应示例：

```json
{
  "id": 1,
  "slug": "will-there-be-another-us-government-shutdown-by-january-31",
  "title": "Will there be another US government shutdown by January 31?",
  "negRisk": false,
  "marketCount": 1,
  "createdAt": "2024-01-15T12:00:00.000Z"
}
```

#### `GET /events/:slug/markets`

获取事件下的所有市场

```bash
curl http://127.0.0.1:8000/events/will-there-be-another-us-government-shutdown-by-january-31/markets
```

### 市场相关

#### `GET /markets/:slug`

获取市场详情

```bash
curl http://127.0.0.1:8000/markets/will-there-be-another-us-government-shutdown-by-january-31
```

响应示例：

```json
{
  "id": 1,
  "slug": "will-there-be-another-us-government-shutdown-by-january-31",
  "conditionId": "0xabc...123",
  "questionId": "0xdef...456",
  "oracle": "0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49",
  "collateralToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "yesTokenId": "0x12345...",
  "noTokenId": "0x67890...",
  "status": "active",
  "enableNegRisk": false,
  "tradeCount": 150,
  "createdAt": "2024-01-15T12:00:00.000Z"
}
```

#### `GET /markets/:slug/trades`

获取市场的交易记录（支持分页和过滤）

查询参数：
- `limit`: 返回条数限制（默认 100，最大 1000）
- `cursor`: 分页偏移量（默认 0）
- `fromBlock`: 起始区块号（可选）
- `toBlock`: 结束区块号（可选）
- `side`: 买卖方向过滤 - `BUY` 或 `SELL`（可选）
- `outcome`: 结果类型过滤 - `YES` 或 `NO`（可选）

```bash
curl "http://127.0.0.1:8000/markets/will-there-be-another-us-government-shutdown-by-january-31/trades?limit=10&cursor=0"
```

响应示例：

```json
{
  "trades": [
    {
      "id": 1,
      "txHash": "0x916cad...",
      "logIndex": 123,
      "blockNumber": 66000000,
      "timestamp": "2024-01-15T12:00:00.000Z",
      "maker": "0xMaker...",
      "taker": "0xTaker...",
      "side": "BUY",
      "outcome": "YES",
      "tokenId": "0x12345...",
      "price": "0.45",
      "size": "100.0"
    }
  ],
  "total": 150,
  "nextCursor": 10
}
```

### Token 相关

#### `GET /tokens/:tokenId/trades`

按 TokenId 获取交易记录（支持同样的查询参数）

```bash
curl "http://127.0.0.1:8000/tokens/0x12345.../trades?limit=10"
```

## 🗂️ 项目结构

```
stage2/
├── src/
│   ├── db/                     # 数据库层
│   │   ├── schema.ts           # 表结构定义
│   │   ├── connection.ts       # 连接管理
│   │   └── store.ts            # 数据访问层（CRUD）
│   ├── indexer/                # 索引器
│   │   ├── gamma-client.ts     # Gamma API 客户端
│   │   ├── market-discovery.ts # Market Discovery Service
│   │   └── trade-sync.ts       # Trade Indexer
│   ├── api/                    # API 服务
│   │   ├── server.ts           # Fastify 服务器
│   │   ├── routes/
│   │   │   ├── markets.ts      # 市场路由
│   │   │   └── events.ts       # 事件路由
│   │   └── types.ts            # API 类型定义
│   ├── types/
│   │   └── index.ts            # 全局类型定义
│   ├── utils/
│   │   └── retry.ts            # 重试工具
│   └── demo.ts                 # 演示脚本
├── tests/                      # 测试文件
├── data/                       # 数据目录
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 核心模块

### 数据库设计

#### `events` 表
存储 Polymarket 事件信息

#### `markets` 表
存储市场信息，包含 conditionId、tokenIds 等

#### `trades` 表
存储交易记录，包含价格、数量、买卖方向等

#### `sync_state` 表
存储同步进度，支持断点续传

### Market Discovery

从 Gamma API 获取市场信息，并使用 Stage1 的 `decodeMarket` 验证 tokenIds 的正确性。

```typescript
import { discoverMarkets } from './src/indexer/market-discovery.js';

const count = await discoverMarkets(db, 'presidential-election-2024');
console.log(`发现了 ${count} 个市场`);
```

### Trade Indexer

扫描 Polygon 链上的 OrderFilled 事件，解码交易详情并存储到数据库。

```typescript
import { runIndexer } from './src/indexer/trade-sync.js';

const result = await runIndexer(db, fromBlock, toBlock);
console.log(`索引了 ${result.totalTrades} 笔交易`);
```

特性：
- ✅ 批量处理（每次 10000 区块）
- ✅ 区块信息缓存
- ✅ 错误重试（指数退避）
- ✅ 幂等写入（`tx_hash + log_index` 唯一索引）
- ✅ 断点续传（`sync_state` 表）

### Query API

基于 Fastify 的高性能 REST API。

特性：
- ✅ 自动类型验证
- ✅ 结构化错误处理
- ✅ 请求日志记录
- ✅ 健康检查端点

## 🧪 验收测试

### 任务 A：Market Discovery

```bash
pnpm demo \
  --event-slug will-there-be-another-us-government-shutdown-by-january-31 \
  --reset-db \
  --db ./data/test_indexer.db

# 验证数据库
sqlite3 ./data/test_indexer.db "SELECT slug, yes_token_id, no_token_id FROM markets LIMIT 5;"
```

### 任务 B：Trade Indexer

```bash
# 基础用法：索引单个区块
pnpm demo \
  --tx-hash 0x916cad96dd5c219997638133512fd17fe7c1ce72b830157e4fd5323cf4f19946 \
  --event-slug will-there-be-another-us-government-shutdown-by-january-31 \
  --output ./data/demo_output.json

# 验证输出
cat ./data/demo_output.json

# 验证数据库
sqlite3 ./data/demo_indexer.db "SELECT COUNT(*) FROM trades;"
```

### 任务 C：API Server

```bash
# 启动服务器
pnpm api ./data/demo_indexer.db 8000 &

# 测试端点
curl http://127.0.0.1:8000/markets/will-there-be-another-us-government-shutdown-by-january-31
curl "http://127.0.0.1:8000/markets/will-there-be-another-us-government-shutdown-by-january-31/trades?limit=5"

# 停止服务器
kill %1
```

### 综合验收流程

```bash
# 1. 初始化并索引数据
pnpm demo \
  --tx-hash 0x916cad96dd5c219997638133512fd17fe7c1ce72b830157e4fd5323cf4f19946 \
  --event-slug will-there-be-another-us-government-shutdown-by-january-31 \
  --reset-db \
  --db ./data/demo_indexer.db \
  --output ./data/demo_output.json

# 2. 检查输出文件
cat ./data/demo_output.json

# 3. 验证数据库内容
sqlite3 ./data/demo_indexer.db "SELECT COUNT(*) FROM markets;"
sqlite3 ./data/demo_indexer.db "SELECT COUNT(*) FROM trades;"

# 4. 启动 API 服务并测试
pnpm api ./data/demo_indexer.db 8000
```

## 🔗 依赖说明

- **viem**: 轻量级以太坊客户端库
- **better-sqlite3**: 高性能 SQLite 数据库
- **fastify**: 快速、低开销的 Web 框架
- **commander**: 命令行参数解析
- **dotenv**: 环境变量管理
- **zod**: 运行时类型验证

## 📝 注意事项

1. **RPC 限流**: 使用 Alchemy 或 Infura 的 RPC 服务，注意速率限制
2. **数据一致性**: 链上数据为权威来源，Gamma API 仅作补充
3. **幂等性**: 索引器支持重复运行，不会产生重复数据
4. **断点续传**: 索引器会记录同步进度，中断后可继续
5. **区块缓存**: 区块信息会缓存在内存中，提高性能

## 🤝 集成 Stage1

本项目依赖 Stage1 的解码器：

```typescript
import { decodeMarket } from '../../../stage1/src/index.js';
import { publicClient } from '../../../stage1/src/utils/client.js';
import { EXCHANGE_ADDRESSES, ORDER_FILLED_ABI } from '../../../stage1/src/constants/index.js';
```

确保 Stage1 项目已正确安装依赖：

```bash
cd ../stage1
pnpm install
cd ../stage2
```

## 📄 许可证

MIT License
