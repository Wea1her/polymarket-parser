# Polymarket 交易解析器

一个用于从 Polygon 区块链获取并解析 Polymarket 交易数据的 Python 工具。

## 功能特性

- ✅ 从 Polygon RPC 节点获取交易数据
- ✅ 解析 Polymarket OrderFilled 事件
- ✅ 自动计算交易价格和方向
- ✅ 提取 maker/taker 地址信息
- ✅ 输出标准化的 JSON 格式（camelCase）
- ✅ 支持 CTF Exchange 和 NegRisk Exchange
- ✅ 完整的错误处理和重试机制

## 快速开始

### 环境要求

- Python 3.12+
- 稳定的网络连接
- Polygon RPC 节点访问

### 安装

```bash
# 克隆项目
cd polymarket-parser

# 创建虚拟环境
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate  # Windows

# 安装依赖
pip install web3 pydantic pydantic-settings structlog
```

### 使用方法

#### 方式 1：使用测试脚本（推荐）

```bash
.venv/bin/python test_real_tx.py <交易哈希>
```

示例：
```bash
.venv/bin/python test_real_tx.py 0x31b913a61730d943e88674ff97f7de5e40a302fd1fdbe2fd98b8fa5bce751552
```

#### 方式 2：使用主程序

```bash
.venv/bin/python -m src.main <交易哈希>
```

#### 方式 3：作为 Python 模块使用

```python
from src.main import PolymarketParser

# 初始化解析器
parser = PolymarketParser()

# 解析交易
tx_hash = "0x31b913a61730d943e88674ff97f7de5e40a302fd1fdbe2fd98b8fa5bce751552"
trades = parser.parse_transaction(tx_hash)

# 输出结果
for trade in trades:
    print(trade.model_dump())
```

## 输出格式

```json
{
  "txHash": "0x31b913a61730d943e88674ff97f7de5e40a302fd1fdbe2fd98b8fa5bce751552",
  "logIndex": 705,
  "exchange": "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  "maker": "0xdc876e6873772d38716fda7f2452a78d426d7ab6",
  "taker": "0xfa15bed0e055226c999e5d4ceef5aceb196895e3",
  "makerAssetId": "0",
  "takerAssetId": "11240144609794675088588251385750462152427779062609952137535104957577820876903",
  "makerAmountFilled": "4410000",
  "takerAmountFilled": "9000000",
  "price": "0.490000",
  "tokenId": "11240144609794675088588251385750462152427779062609952137535104957577820876903",
  "side": "BUY"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| txHash | string | 交易哈希 |
| logIndex | number | 日志在交易中的索引 |
| exchange | string | 交易所合约地址 |
| maker | string | 挂单方地址 |
| taker | string | 吃单方地址 |
| makerAssetId | string | 挂单方资产 ID（0 = USDC） |
| takerAssetId | string | 吃单方资产 ID（0 = USDC） |
| makerAmountFilled | string | 挂单方成交数量（最小单位） |
| takerAmountFilled | string | 吃单方成交数量（最小单位） |
| price | string | 成交价格（归一化后，保留 6 位小数） |
| tokenId | string | 头寸代币 ID |
| side | string | 交易方向（BUY/SELL） |

## 项目结构

```
polymarket-parser/
├── src/
│   ├── __init__.py           # 包初始化
│   ├── config.py             # 配置管理
│   ├── models.py             # 数据模型
│   ├── rpc_client.py         # RPC 客户端
│   ├── parser.py             # 事件解析器
│   ├── calculator.py         # 价格计算器
│   └── main.py               # 主程序入口
├── tests/
│   ├── test_unit.py          # 单元测试
│   ├── test_real_tx.py       # 真实交易测试
│   └── test_basic.py         # 基础功能测试
├── docs/
│   └── architecture.md       # 架构文档
├── logs/                     # 日志目录
├── pyproject.toml            # 项目配置
└── README.md                 # 本文件
```

## 配置

### 环境变量

创建 `.env` 文件（可选）：

```bash
# Polygon RPC 节点 URL
POLYGON_RPC_URL=https://polygon-rpc.com

# CTF Exchange 合约地址
CTF_EXCHANGE_ADDRESS=0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E

# NegRisk Exchange 合约地址
NEGRISK_EXCHANGE_ADDRESS=0xC5d563A36AE78145C45a50134d48A1215220f80a

# 日志级别
LOG_LEVEL=INFO
```

### 支持的合约

- **CTF Exchange**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- **NegRisk Exchange**: `0xC5d563A36AE78145C45a50134d48A1215220f80a`

## 技术实现

### 核心技术

- **Web3.py**: 与 Polygon 区块链交互
- **Pydantic**: 数据验证和序列化
- **Structlog**: 结构化日志记录
- **Decimal**: 高精度价格计算

### 关键特性

1. **POA 链支持**: 使用 `ExtraDataToPOAMiddleware` 支持 Polygon
2. **自动重试**: RPC 调用失败时自动重试（最多 3 次）
3. **精确计算**: 使用 Decimal 类型避免浮点数误差
4. **类型安全**: 全面使用 Pydantic 进行类型验证
5. **HexBytes 处理**: 正确处理 web3.py 返回的 HexBytes 对象

### 价格计算逻辑

```python
# 识别 USDC 方（assetId = "0"）
if maker_asset_id == "0":
    side = "BUY"   # Maker 出 USDC 买入 Token
else:
    side = "SELL"  # Taker 出 USDC，Maker 卖出 Token

# 归一化数量（USDC 精度为 6 位小数）
usdc_amount = Decimal(usdc_raw) / Decimal(10 ** 6)
token_amount = Decimal(token_raw) / Decimal(10 ** 6)

# 计算价格
price = usdc_amount / token_amount
```

## 测试

### 运行单元测试

```bash
.venv/bin/python test_unit.py
```

测试覆盖：
- ✅ BUY 订单解析
- ✅ SELL 订单解析
- ✅ 极小金额处理
- ✅ 极大金额处理
- ✅ 异常数据处理

### 运行真实交易测试

```bash
.venv/bin/python test_real_tx.py 0x31b913a61730d943e88674ff97f7de5e40a302fd1fdbe2fd98b8fa5bce751552
```

## 性能

- 单笔交易解析时间: < 1 秒（包括 RPC 调用）
- RPC 调用成功率: > 99%（含重试）
- 解析准确率: 100%

## 错误处理

### 自动重试

RPC 调用失败时自动重试，使用指数退避策略：
- 第 1 次重试: 等待 1 秒
- 第 2 次重试: 等待 2 秒
- 第 3 次重试: 等待 3 秒

### 日志记录

使用 structlog 记录所有关键操作：
- **INFO**: 正常操作（获取交易、解析成功）
- **WARNING**: 警告信息（未找到事件、重试）
- **ERROR**: 错误信息（解析失败、RPC 失败）

## 常见问题

### Q: 为什么找不到 OrderFilled 事件？

A: 可能的原因：
1. 该交易不是 Polymarket 交易
2. 该交易没有触发 OrderFilled 事件
3. 合约地址不匹配

### Q: 如何提高 RPC 调用成功率？

A: 建议使用付费 RPC 服务：
- Alchemy: https://www.alchemy.com/
- Infura: https://www.infura.io/
- QuickNode: https://www.quicknode.com/

### Q: 价格计算是否准确？

A: 是的。我们使用 Python Decimal 类型进行高精度计算，避免浮点数误差。所有价格保留 6 位小数。

### Q: 支持哪些交易所？

A: 目前支持：
- CTF Exchange（普通二元市场）
- NegRisk Exchange（多结果负风险市场）

## 开发

### 添加新的交易所

在 `src/config.py` 中添加新的合约地址：

```python
class Settings(BaseSettings):
    new_exchange_address: str = "0x..."
```

### 扩展事件类型

在 `src/parser.py` 中添加新的事件解析逻辑。

## 文档

- [架构文档](docs/architecture.md) - 详细的技术架构说明
- [技术文档](../docs/polymarket-trade-parser-technical.md) - 完整的技术实现文档
- [产品需求文档](../discuss/polymarket-trade-parser-prd.md) - 产品需求和规格

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请提交 Issue。

---

**注意**: 本工具仅用于数据解析和分析，不提供交易功能。使用前请确保遵守相关法律法规。
