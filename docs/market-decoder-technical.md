# Polymarket 市场解码器技术文档

## 1. 概述

市场解码器（Market Decoder）是 Polymarket 交易解析器的核心组件之一，用于从链上数据计算市场的核心参数，特别是 YES/NO 头寸的 TokenId。

### 1.1 核心功能

- 从 conditionId 计算 YES/NO 头寸的 TokenId
- 支持自定义抵押品代币
- 验证 tokenId 是否属于指定市场
- 输出标准化的 JSON 格式

### 1.2 应用场景

- **交易归类**：将链上交易归类到具体市场
- **市场索引**：构建市场索引器的基础
- **数据验证**：验证 API 数据与链上计算的一致性
- **头寸识别**：识别交易是 YES 还是NO 头寸

## 2. 技术原理

### 2.1 Gnosis 条件代币框架

Polymarket 基于 Gnosis 条件代币框架（Conditional Tokens Framework）构建。该框架使用以下公式计算头寸 TokenId：

```
1. collectionId = keccak256(parentCollectionId, conditionId, indexSet)
2. positionId = keccak256(collateralToken, collectionId)
```

### 2.2 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| parentCollectionId | bytes32 | 父集合 ID，Polymarket 中为空字节（0x00...00） |
| conditionId | bytes32 | 条件 ID，唯一标识一个市场 |
| indexSet | uint256 | 索引集，1 表示 YES，2 表示 NO |
| collateralToken | address | 抵押品代币地址，Polymarket 使用 USDC.e |

### 2.3 计算步骤

#### 步骤 1：计算 CollectionId

```python
# YES 头寸（indexSet = 1）
collection_id_yes = keccak256(
    parentCollectionId +  # bytes32(0)
    conditionId +         # bytes32
    uint256(1)            # bytes32
)

# NO 头寸（indexSet = 2）
collection_id_no = keccak256(
    parentCollectionId +  # bytes32(0)
    conditionId +         # bytes32
    uint256(2)            # bytes32
)
```

#### 步骤 2：计算 PositionId（TokenId）

```python
# YES TokenId
yes_token_id = keccak256(
    collateralToken +     # address (20 bytes)
    collection_id_yes     # bytes32
)

# NO TokenId
no_token_id = keccak256(
    collateralToken +     # address (20 bytes)
    collection_id_no      # bytes32
)
```

### 2.4 关键实现细节

1. **字节拼接**：使用 `abi.encodePacked` 的方式直接拼接字节
2. **哈希算法**：使用 keccak256（与 Solidity 一致）
3. **数据格式**：
   - conditionId：32 字节（bytes32）
   - indexSet：32 字节（uint256 编码为 bytes32）
   - collateralToken：20 字节（address）
4. **输出格式**：TokenId 转换为十进制字符串

## 3. 使用方法

### 3.1 基本使用

```python
from src.market_decoder import MarketDecoder

# 初始化解码器
decoder = MarketDecoder()

# 解码市场参数
market_params = decoder.decode_market(
    condition_id="0xabc...123",
    question_id="0xdef...456",  # 可选
    oracle="0x1234...5678"      # 可选
)

# 输出结果
print(f"YES Token ID: {market_params.yesTokenId}")
print(f"NO Token ID: {market_params.noTokenId}")
```

### 3.2 自定义抵押品代币

```python
# 使用自定义抵押品代币
custom_token = "0x1111111111111111111111111111111111111111"
decoder = MarketDecoder(collateral_token=custom_token)

market_params = decoder.decode_market(condition_id)
```

### 3.3 验证 TokenId

```python
# 验证 tokenId 是否属于指定市场
is_valid = decoder.verify_token_id(token_id, condition_id)

if is_valid:
    print("TokenId 属于该市场")
else:
    print("TokenId 不属于该市场")
```

### 3.4 与交易解析器集成

```python
from src.main import PolymarketParser
from src.market_decoder import MarketDecoder

# 步骤 1: 解析交易
parser = PolymarketParser()
trades = parser.parse_transaction(tx_hash)
token_id = trades[0].tokenId

# 步骤 2: 解码市场参数
decoder = MarketDecoder()
market_params = decoder.decode_market(condition_id)

# 步骤 3: 判断交易方向
if token_id == market_params.yesTokenId:
    print("这笔交易是 YES 头寸")
elif token_id == market_params.noTokenId:
    print("这笔交易是 NO 头寸")
else:
    print("警告：tokenId 不匹配！")
```

## 4. 数据格式

### 4.1 输入

```python
{
    "condition_id": "0xabc...123",      # 必需
    "question_id": "0xdef...456",       # 可选
    "oracle": "0x1234...5678"           # 可选
}
```

### 4.2 输出

```json
{
  "conditionId": "0xabc...123",
  "questionId": "0xdef...456",
  "oracle": "0x1234...5678",
  "collateralToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "yesTokenId": "123456789...",
  "noTokenId": "987654321..."
}
```

### 4.3 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| conditionId | string | 条件 ID（bytes32 十六进制字符串） |
| questionId | string | 问题 ID（bytes32 十六进制字符串） |
| oracle | string | 预言机地址 |
| collateralToken | string | 抵押品代币地址（USDC.e） |
| yesTokenId | string | YES 头寸 TokenId（十进制字符串） |
| noTokenId | string | NO 头寸 TokenId（十进制字符串） |

## 5. 与 Polymarket Gamma API 集成

### 5.1 获取市场信息

```bash
# 通过 slug 获取市场信息
curl https://gamma-api.polymarket.com/markets/{slug}

# 通过 conditionId 获取市场信息
curl https://gamma-api.polymarket.com/markets?condition_id={conditionId}
```

### 5.2 API 响应示例

```json
{
  "id": "0x...",
  "question": "Will...",
  "conditionId": "0xabc...123",
  "tokens": [
    {
      "tokenId": "123456789...",
      "outcome": "Yes"
    },
    {
      "tokenId": "987654321...",
      "outcome": "No"
    }
  ]
}
```

### 5.3 验证流程

1. 从 Gamma API 获取市场的 conditionId 和 tokens
2. 使用 MarketDecoder 计算 YES/NO tokenIds
3. 对比 API 返回的 tokens 与计算结果
4. 如果匹配，说明计算逻辑正确

```python
import requests
from src.market_decoder import MarketDecoder

# 从 Gamma API 获取市场数据
response = requests.get(f"https://gamma-api.polymarket.com/markets/{slug}")
market_data = response.json()

# 使用解码器计算
decoder = MarketDecoder()
market_params = decoder.decode_market(market_data["conditionId"])

# 验证
gamma_yes = market_data["tokens"][0]["tokenId"]
gamma_no = market_data["tokens"][1]["tokenId"]

assert market_params.yesTokenId == gamma_yes
assert market_params.noTokenId == gamma_no
print("✅ 验证通过！")
```

## 6. 常量配置

### 6.1 USDC.e 地址（Polygon）

```python
USDC_COLLATERAL_TOKEN = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
```

### 6.2 父集合 ID

```python
PARENT_COLLECTION_ID = bytes(32)  # 0x00...00
```

### 6.3 索引集

```python
YES_INDEX_SET = 1  # 0b01
NO_INDEX_SET = 2   # 0b10
```

## 7. 测试

### 7.1 单元测试

```bash
.venv/bin/python test_market_decoder.py
```

测试覆盖：
- ✅ 基本 TokenId 计算
- ✅ TokenId 验证功能
- ✅ 不同 conditionId 产生不同 TokenId
- ✅ JSON 输出格式
- ✅ 十六进制字符串标准化
- ✅ 自定义抵押品代币

### 7.2 真实数据测试

```bash
.venv/bin/python test_market_real.py
```

测试覆盖：
- ✅ 真实交易数据验证
- ✅ 已知市场示例
- ✅ 与交易解析器集成
- ✅ Gamma API 集成指南
- ✅ 完整验证示例

## 8. 性能考虑

### 8.1 计算复杂度

- 时间复杂度：O(1)
- 空间复杂度：O(1)
- 单次计算时间：< 1ms

### 8.2 优化建议

1. **缓存结果**：对于相同的 conditionId，可以缓存计算结果
2. **批量计算**：支持批量计算多个市场的 TokenId
3. **预计算**：对于已知市场，可以预先计算并存储

## 9. 错误处理

### 9.1 输入验证

```python
# 自动标准化十六进制格式
condition_id = "0x1234..."  # 带 0x 前缀
condition_id = "1234..."    # 不带 0x 前缀
condition_id = "0X1234..."  # 大写 0X 前缀

# 都会被标准化为：0x1234...（小写，带 0x 前缀）
```

### 9.2 异常情况

- **无效的十六进制字符串**：自动处理奇数长度
- **空字符串**：返回空字符串
- **大小写混合**：自动转换为小写

## 10. 扩展性

### 10.1 支持的扩展

1. **多链支持**：通过配置不同的抵押品代币地址
2. **批量处理**：扩展为支持批量计算
3. **缓存机制**：添加 LRU 缓存提高性能
4. **异步支持**：使用 asyncio 提高并发性能

### 10.2 未来改进

1. **链上验证**：直接从链上读取 conditionId
2. **事件监听**：监听 ConditionPreparation 事件
3. **数据库集成**：将计算结果存储到数据库
4. **API 服务**：提供 HTTP API 接口

## 11. 安全考虑

### 11.1 输入验证

- 验证 conditionId 格式（64 位十六进制字符串）
- 验证地址格式（40 位十六进制字符串）
- 类型安全（Pydantic）

### 11.2 计算安全

- 使用标准的 keccak256 哈希算法
- 避免整数溢出（Python 原生支持大整数）
- 确保字节拼接顺序正确

## 12. 参考资料

### 12.1 官方文档

- [Gnosis Conditional Tokens Framework](https://docs.gnosis.io/conditionaltokens/)
- [Polymarket Documentation](https://docs.polymarket.com/)
- [Polymarket Gamma API](https://gamma-api.polymarket.com/docs)

### 12.2 相关合约

- **ConditionalTokens**: Gnosis 条件代币合约
- **CTF Exchange**: Polymarket 交易所合约
- **USDC.e**: Polygon 上的 USDC 代币

### 12.3 代码示例

- `src/market_decoder.py`: 市场解码器实现
- `test_market_decoder.py`: 单元测试
- `test_market_real.py`: 真实数据测试

## 13. 常见问题

### Q1: 为什么 TokenId 是十进制字符串？

A: 因为 TokenId 是 uint256 类型，在 JavaScript/TypeScript 中无法直接表示（超过 Number.MAX_SAFE_INTEGER），所以使用字符串格式。

### Q2: 如何获取 conditionId？

A: 有三种方式：
1. 从 Polymarket Gamma API 获取
2. 监听链上的 ConditionPreparation 事件
3. 从已知的交易中反推（需要额外的链上查询）

### Q3: 计算结果与 Gamma API 不一致怎么办？

A: 检查以下几点：
1. conditionId 是否正确
2. 抵押品代币地址是否正确（应为 USDC.e）
3. 计算逻辑是否正确（参考本文档）
4. API 返回的数据是否正确

### Q4: 支持其他链吗？

A: 理论上支持，但需要：
1. 修改抵押品代币地址
2. 确认该链使用相同的条件代币框架
3. 验证计算逻辑的正确性

### Q5: 如何提高计算性能？

A: 建议：
1. 缓存已计算的结果
2. 批量计算多个市场
3. 预计算常用市场的 TokenId

## 14. 总结

市场解码器是 Polymarket 数据处理的核心组件，它能够：

- ✅ 准确计算 YES/NO 头寸的 TokenId
- ✅ 验证交易与市场的对应关系
- ✅ 支持与 Gamma API 的数据验证
- ✅ 提供标准化的 JSON 输出格式

通过结合交易解析器（Trade Decoder）和市场解码器（Market Decoder），可以构建完整的 Polymarket 数据索引系统。
