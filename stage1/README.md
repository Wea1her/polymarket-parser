# Polymarket 链上数据解码器

一个基于 TypeScript 和 viem 的 Polymarket 链上数据解码工具，支持交易日志解析和市场参数计算。

## ✨ 特性

- 🔍 **交易解码**（任务 A）：解析 Polygon 链上的交易哈希，提取 OrderFilled 事件详情
- 🎯 **市场解码**（任务 B）：根据 conditionId 计算市场的 YES/NO 头寸 TokenId
- ⚡ **高性能**：使用 viem（比 ethers.js 体积小 4 倍，性能更好）
- 🛡️ **类型安全**：完整的 TypeScript 类型定义
- 🔧 **双模式**：既可作为 CLI 工具使用，也可作为库集成到项目中
- ✅ **测试覆盖**：包含完整的单元测试

## 📦 安装

```bash
# 克隆项目
git clone <repository-url>
cd stage1

# 安装依赖
pnpm install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置 POLYGON_RPC_URL
```

## 🚀 快速开始

### 环境配置

在项目根目录创建 `.env` 文件：

```env
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

> 💡 推荐使用 [Alchemy](https://www.alchemy.com/) 或 [Infura](https://www.infura.io/) 提供的 RPC 服务

### CLI 使用

```bash
# 编译项目
pnpm build

# 查看帮助
pnpm cli --help

# 解码交易
pnpm cli decode-trade --tx 0xabc...123 --pretty

# 解码市场
pnpm cli decode-market \
  --condition-id 0xdef...456 \
  --question-id 0x789...abc \
  --oracle 0x123...oracle \
  --pretty

# 查看示例
pnpm cli examples
```

### 作为库使用

```typescript
import { decodeTrade, decodeMarket } from 'polymarket-decoder';

// 解码交易
const trades = await decodeTrade('0xabc...123');
console.log(trades[0].price); // 成交价格
console.log(trades[0].side);  // BUY 或 SELL

// 解码市场
const market = decodeMarket({
  conditionId: '0xdef...456',
  questionId: '0x789...abc',
  oracle: '0x123...oracle'
});
console.log(market.yesTokenId); // YES 头寸 TokenId
console.log(market.noTokenId);  // NO 头寸 TokenId
```

## 📚 API 文档

### 交易解码器

#### `decodeTrade(txHash: string): Promise<TradeDecoded[]>`

解析交易哈希，提取所有 OrderFilled 事件。

**参数：**
- `txHash`: 交易哈希（0x 开头的 66 位十六进制字符串）

**返回：**
- `TradeDecoded[]`: 交易解码结果数组

**TradeDecoded 接口：**

```typescript
interface TradeDecoded {
  txHash: string;              // 交易哈希
  logIndex: number;            // 日志索引
  exchange: string;            // 交易所合约地址
  maker: string;               // 挂单方地址
  taker: string;               // 吃单方地址
  makerAssetId: string;        // maker 资产 ID（0=USDC）
  takerAssetId: string;        // taker 资产 ID
  makerAmountFilled: string;   // maker 成交数量
  takerAmountFilled: string;   // taker 成交数量
  price: string;               // 成交价格（USDC per share）
  tokenId: string;             // 头寸 TokenId
  side: "BUY" | "SELL";        // 买卖方向
}
```

**示例：**

```typescript
const trades = await decodeTrade('0xfa0746b1...9198');

// 输出第一笔交易
console.log(JSON.stringify(trades[0], null, 2));
```

#### `decodeTradesBatch(txHashes: string[]): Promise<TradeDecoded[]>`

批量解码多个交易。

### 市场解码器

#### `decodeMarket(params: MarketDecodeParams): MarketDecoded`

根据市场参数计算 YES/NO 头寸的 TokenId。

**参数：**

```typescript
interface MarketDecodeParams {
  conditionId: string;  // 条件 ID（bytes32）
  questionId: string;   // 问题 ID（bytes32）
  oracle: string;       // 预言机地址
}
```

**返回：**

```typescript
interface MarketDecoded {
  conditionId: string;      // 条件 ID
  questionId: string;       // 问题 ID
  oracle: string;           // 预言机地址
  collateralToken: string;  // 抵押品地址（USDC）
  yesTokenId: string;       // YES 头寸 TokenId
  noTokenId: string;        // NO 头寸 TokenId
}
```

**示例：**

```typescript
const market = decodeMarket({
  conditionId: '0xabc...123',
  questionId: '0xdef...456',
  oracle: '0x789...oracle'
});

console.log(`YES Token: ${market.yesTokenId}`);
console.log(`NO Token: ${market.noTokenId}`);
```

## 🔧 工具函数

### 哈希计算

```typescript
import { getCollectionId, getPositionId } from 'polymarket-decoder';

// 计算 CollectionId
const collectionId = getCollectionId(
  parentCollectionId,
  conditionId,
  indexSet // 1n for YES, 2n for NO
);

// 计算 PositionId (TokenId)
const tokenId = getPositionId(collateralToken, collectionId);
```

### 验证函数

```typescript
import { isValidBytes32, isValidAddress } from 'polymarket-decoder';

if (isValidBytes32(conditionId)) {
  // conditionId 格式正确
}

if (isValidAddress(oracle)) {
  // oracle 地址格式正确
}
```

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行单次测试（不监听）
pnpm test:run

# 查看测试覆盖率
pnpm test -- --coverage
```

## 📖 核心概念

### Polymarket 数据模型

1. **Condition（条件）**：市场的链上唯一标识
   - `conditionId = keccak256(oracle, questionId, outcomeSlotCount)`

2. **Collection（集合）**：特定条件下的结果集合
   - `collectionId = keccak256(parentCollectionId, conditionId, indexSet)`
   - `indexSet = 1`（二进制 0b01）表示 YES
   - `indexSet = 2`（二进制 0b10）表示 NO

3. **Position（头寸/TokenId）**：可交易的 ERC-1155 代币
   - `tokenId = keccak256(collateralToken, collectionId)`

### 交易解析逻辑

- **OrderFilled 事件**：记录订单撮合详情
- **资产类型判断**：
  - `assetId = 0` → USDC（稳定币）
  - `assetId ≠ 0` → Outcome Token（头寸代币）
- **方向判断**：
  - `makerAssetId = 0` → BUY（maker 用 USDC 买入头寸）
  - `takerAssetId = 0` → SELL（taker 用 USDC 买入，maker 卖出头寸）
- **价格计算**：
  - `price = USDC_amount / token_amount`

## 🌟 viem 的优势

相比 ethers.js，viem 提供：

1. **更小的体积**：约 4 倍体积缩减
2. **更好的类型安全**：原生 TypeScript，精确的类型推断
3. **更快的性能**：优化的编码/解码逻辑
4. **模块化设计**：按需导入，支持 tree-shaking
5. **现代化 API**：使用最新 JavaScript 特性

## 📁 项目结构

```
stage1/
├── src/
│   ├── constants/         # 常量定义
│   │   └── index.ts       # 合约地址、ABI 等
│   ├── types/             # 类型定义
│   │   ├── index.ts       # 主要接口
│   │   └── contracts.ts   # 合约事件类型
│   ├── utils/             # 工具函数
│   │   ├── client.ts      # viem client 配置
│   │   └── hash.ts        # 哈希计算
│   ├── decoders/          # 核心解码器
│   │   ├── trade-decoder.ts   # 任务 A
│   │   └── market-decoder.ts  # 任务 B
│   ├── cli.ts             # CLI 入口
│   └── index.ts           # 库导出
├── tests/                 # 测试文件
│   ├── fixtures/          # 测试数据
│   ├── hash.test.ts       # 哈希工具测试
│   └── market-decoder.test.ts  # 市场解码器测试
└── README.md
```

## 🔗 相关资源

- [Polymarket 官方文档](https://docs.polymarket.com/)
- [Gnosis Conditional Tokens Framework](https://docs.gnosis.io/conditionaltokens/)
- [viem 文档](https://viem.sh/)
- [Polygon 区块链浏览器](https://polygonscan.com/)

## 📝 注意事项

1. **RPC 限流**：公共 RPC 可能有速率限制，推荐使用 Alchemy 或 Infura
2. **精度处理**：USDC 使用 6 位小数，计算时注意精度
3. **网络选择**：Polymarket 部署在 Polygon 主网
4. **交易确认**：建议等待至少 10 个区块确认后再解析交易

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

