#!/usr/bin/env python3
"""使用已知的 Polymarket 交易进行测试"""
import sys
sys.path.insert(0, '/home/yexianglun/my_projects/demo/polymarket-parser')

from src.main import PolymarketParser
import json

# 使用一个已知的 Polymarket 交易哈希进行测试
# 这个交易哈希需要从 Polygonscan 或 Polymarket 获取
# 示例：从 Polymarket 的 CTF Exchange 合约的交易历史中获取

# 测试交易哈希（需要替换为真实的）
test_transactions = [
    # 这里需要填入真实的 Polymarket 交易哈希
    # 可以从 https://polygonscan.com/address/0x4bFb41d5B819043544C655D4DfAe3A8497B69b88 获取
]

print("=" * 80)
print("Polymarket 交易解析器 - 完整测试")
print("=" * 80)

if not test_transactions:
    print("\n⚠ 警告：没有提供测试交易哈希")
    print("\n请提供一个真实的 Polymarket 交易哈希进行测试。")
    print("可以从以下来源获取：")
    print("1. Polygonscan CTF Exchange: https://polygonscan.com/address/0x4bFb41d5B819043544C655D4DfAe3A8497B69b88")
    print("2. Polygonscan NegRisk Exchange: https://polygonscan.com/address/0xC5d563A36AE78145C45a50134d48A1215220f80a")
    print("\n用法: python test_real_tx.py <tx_hash>")

    # 如果命令行提供了交易哈希，使用它
    if len(sys.argv) > 1:
        test_transactions = [sys.argv[1]]
    else:
        sys.exit(1)

parser = PolymarketParser()

for tx_hash in test_transactions:
    print(f"\n{'=' * 80}")
    print(f"测试交易: {tx_hash}")
    print('=' * 80)

    try:
        trades = parser.parse_transaction(tx_hash)

        if trades:
            print(f"\n✓ 成功解析 {len(trades)} 笔交易")
            print("\n解析结果:")
            for i, trade in enumerate(trades, 1):
                print(f"\n交易 #{i}:")
                print(json.dumps(trade.model_dump(), indent=2, ensure_ascii=False))
        else:
            print("\n✗ 未找到 OrderFilled 事件")
            print("可能原因：")
            print("1. 该交易不是 Polymarket 交易")
            print("2. 该交易没有触发 OrderFilled 事件")
            print("3. 事件签名不匹配")

    except Exception as e:
        print(f"\n✗ 解析失败: {e}")
        import traceback
        traceback.print_exc()

print(f"\n{'=' * 80}")
print("测试完成")
print('=' * 80)
