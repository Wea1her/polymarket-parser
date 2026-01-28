#!/usr/bin/env python3
"""测试脚本 - 验证基本功能"""
import sys
sys.path.insert(0, '/home/yexianglun/my_projects/demo/polymarket-parser')

from src.rpc_client import RPCClient
from src.parser import EventParser
from web3 import Web3

# 测试 RPC 连接
print("=" * 80)
print("测试 1: RPC 连接")
print("=" * 80)

rpc_url = "https://polygon-rpc.com"
client = RPCClient(rpc_url)

if client.is_connected():
    print("✓ RPC 连接成功")
else:
    print("✗ RPC 连接失败")
    sys.exit(1)

# 测试获取一个已知的 Polygon 交易
print("\n" + "=" * 80)
print("测试 2: 获取交易回执")
print("=" * 80)

# 使用一个已知的 Polygon 交易哈希（任意交易）
test_tx = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

try:
    # 先测试获取最新区块
    latest_block = client.w3.eth.block_number
    print(f"✓ 最新区块号: {latest_block}")

    # 获取最新区块的交易
    block = client.w3.eth.get_block(latest_block, full_transactions=True)
    if block['transactions']:
        test_tx = block['transactions'][0]['hash'].hex()
        print(f"✓ 获取到测试交易: {test_tx}")

        receipt = client.get_transaction_receipt(test_tx)
        print(f"✓ 成功获取交易回执")
        print(f"  - 区块号: {receipt['blockNumber']}")
        print(f"  - 日志数量: {len(receipt['logs'])}")
    else:
        print("✗ 区块中没有交易")

except Exception as e:
    print(f"✗ 获取交易失败: {e}")

# 测试事件签名计算
print("\n" + "=" * 80)
print("测试 3: 事件签名计算")
print("=" * 80)

parser = EventParser()
print(f"OrderFilled 事件主题: {parser.order_filled_topic}")

# 验证支持的交易所地址
print(f"\n支持的交易所:")
for addr in parser.supported_exchanges:
    print(f"  - {addr}")

print("\n" + "=" * 80)
print("基本功能测试完成")
print("=" * 80)
