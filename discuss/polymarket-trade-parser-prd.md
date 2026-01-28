# Polymarket 交易解析器 - 产品需求文档

## 1. 产品概述

### 1.1 产品定位
一个用于从 Polygon 区块链获取并解析 Polymarket 交易数据的工具，能够将链上原始交易日志转换为结构化的交易信息。

### 1.2 核心价值
- 自动化获取 Polymarket 交易数据
- 准确解析复杂的链上事件日志
- 提供标准化的交易数据输出格式

### 1.3 目标用户
- 量化交易团队
- 数据分析师
- Polymarket 市场研究人员
- DeFi 开发者

## 2. 功能需求

### 2.1 数据获取模块

#### 2.1.1 RPC 接口调用
- **功能描述**：通过 Polygon RPC 节点获取交易回执
- **技术实现**：调用 `eth_getTransactionReceipt` 方法
- **输入参数**：交易哈希（txHash）
- **输出结果**：完整的交易回执对象，包含所有事件日志

#### 2.1.2 事件过滤
- **功能描述**：从交易日志中筛选出 OrderFilled 事件
- **过滤条件**：
  - 合约地址匹配
  - 事件主题（topic）匹配
- **支持的合约**：
  - CTF Exchange: `0x4bFb41...8B8982E`（普通二元市场）
  - NegRisk_CTFExchange: `0xC5d563...5220f80a`（多结果负风险市场）

### 2.2 数据解析模块

#### 2.2.1 事件字段提取
从 OrderFilled 事件日志中提取以下原始字段：
- `makerAssetId`：挂单方资产 ID
- `takerAssetId`：吃单方资产 ID
- `makerAmountFilled`：挂单方成交数量（链上最小单位）
- `takerAmountFilled`：吃单方成交数量（链上最小单位）

#### 2.2.2 资产类型识别
- **USDC 识别规则**：assetId = 0
- **头寸代币识别规则**：assetId ≠ 0
- **约束条件**：每笔交易必须有一方是 USDC

#### 2.2.3 价格计算
- **计算公式**：
  ```
  price = USDC_amount / token_amount
  ```
- **精度处理**：
  - USDC 精度：6 位小数（除以 10^6）
  - 头寸代币精度：与 USDC 等值单位
- **计算示例**：
  ```
  makerAmountFilled = 1000000 (1.0 USDC)
  takerAmountFilled = 500000 (0.5 份头寸)
  price = 1.0 / 0.5 = 2.0
  ```

#### 2.2.4 交易方向判断
- **BUY（买入）**：
  - 条件：`makerAssetId = 0`
  - 含义：挂单方用 USDC 买入头寸代币
- **SELL（卖出）**：
  - 条件：`takerAssetId = 0`
  - 含义：挂单方卖出头寸代币换取 USDC

#### 2.2.5 TokenId 提取
- **提取规则**：选择非零的 assetId
- **逻辑**：
  ```
  tokenId = makerAssetId != 0 ? makerAssetId : takerAssetId
  ```

### 2.3 数据输出模块

#### 2.3.1 JSON 格式定义
```json
{
  "txHash": "0x...",
  "logIndex": 0,
  "exchange": "0x4bFb41...8B8982E",
  "tokenId": "123456789",
  "price": "2.0",
  "side": "BUY",
  "makerAmountFilled": "1000000",
  "takerAmountFilled": "500000"
}
```

#### 2.3.2 字段说明
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| txHash | string | 交易哈希 | "0xabc..." |
| logIndex | number | 日志在交易中的索引 | 0 |
| exchange | string | 交易所合约地址 | "0x4bFb41..." |
| tokenId | string | 头寸代币 ID | "123456789" |
| price | string | 成交价格（归一化后） | "2.0" |
| side | string | 交易方向 | "BUY" / "SELL" |
| makerAmountFilled | string | 挂单方成交数量（原始值） | "1000000" |
| takerAmountFilled | string | 吃单方成交数量（原始值） | "500000" |

## 3. 技术规格

### 3.1 区块链相关
- **网络**：Polygon (Matic)
- **RPC 方法**：`eth_getTransactionReceipt`
- **合约标准**：ERC-1155（头寸代币）
- **稳定币**：USDC（6 位小数精度）

### 3.2 数据精度要求
- 价格计算：保留足够精度，避免浮点数误差
- 数量字段：使用字符串存储原始值
- 价格字段：使用字符串存储计算结果

### 3.3 异常处理
- RPC 调用失败重试机制
- 日志格式不匹配的容错处理
- 异常数据（如双方 assetId 都非零）的告警

## 4. 业务规则

### 4.1 核心约束
1. 每笔 OrderFilled 事件必须有一方资产为 USDC（assetId = 0）
2. 价格计算必须使用归一化后的数量（除以精度）
3. 交易方向判断基于 USDC 在哪一方

### 4.2 数据一致性
- txHash + logIndex 唯一标识一条成交记录
- 同一交易可能包含多条 OrderFilled 事件
- 每条事件独立解析和输出

## 5. 非功能需求

### 5.1 性能要求
- 单笔交易解析时间 < 100ms
- 支持批量处理多笔交易
- RPC 调用超时时间：30 秒

### 5.2 可靠性要求
- 解析准确率：100%
- 异常情况有明确的错误提示
- 支持日志记录和问题追溯

### 5.3 可扩展性
- 支持添加新的交易所合约地址
- 支持扩展其他事件类型的解析
- 输出格式可配置

## 6. 实现建议

### 6.1 技术栈选择
- **语言**：Python（推荐）或 TypeScript
- **Web3 库**：web3.py / ethers.js
- **数据处理**：强类型定义（Pydantic / TypeScript interfaces）

### 6.2 架构设计
```
输入层（RPC Client）
    ↓
过滤层（Event Filter）
    ↓
解析层（Parser）
    ↓
计算层（Price Calculator / Side Detector）
    ↓
输出层（JSON Formatter）
```

### 6.3 代码组织
- 每个模块独立文件（≤ 300 行）
- 强类型定义所有数据结构
- 单元测试覆盖核心逻辑

## 7. 测试用例

### 7.1 正常场景
- 测试 BUY 方向的交易解析
- 测试 SELL 方向的交易解析
- 测试不同合约地址的事件

### 7.2 边界场景
- 极小金额交易（精度测试）
- 极大金额交易（溢出测试）
- 单笔交易包含多个 OrderFilled 事件

### 7.3 异常场景
- RPC 节点不可用
- 交易哈希不存在
- 日志格式异常

## 8. 交付物

### 8.1 代码交付
- 完整的源代码（符合架构规范）
- 单元测试代码
- 集成测试脚本

### 8.2 文档交付
- API 使用文档
- 部署运维文档
- 常见问题解答

### 8.3 配置文件
- RPC 节点配置
- 合约地址配置
- 日志配置

## 9. 后续规划

### 9.1 功能增强
- 支持实时监听新交易
- 支持历史数据批量导出
- 支持多链扩展（Ethereum、Arbitrum 等）

### 9.2 性能优化
- 引入缓存机制
- 支持并发处理
- 优化 RPC 调用频率

### 9.3 数据分析
- 提供交易统计功能
- 支持价格趋势分析
- 生成市场深度数据
