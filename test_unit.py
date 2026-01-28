#!/usr/bin/env python3
"""单元测试 - 验证核心逻辑"""
import sys
sys.path.insert(0, '/home/yexianglun/my_projects/demo/polymarket-parser')

from src.calculator import PriceCalculator
from src.models import OrderFilledEvent, ParsedTrade
from decimal import Decimal

print("=" * 80)
print("单元测试 - 价格计算和方向判断")
print("=" * 80)

calculator = PriceCalculator()

# 测试用例 1: BUY 订单（Maker 出 USDC）
print("\n测试 1: BUY 订单")
print("-" * 80)
event1 = OrderFilledEvent(
    tx_hash="0xtest1",
    log_index=0,
    exchange="0x4bFb41d5B819043544C655D4DfAe3A8497B69b88",
    maker_asset_id="0",  # Maker 出 USDC
    taker_asset_id="123456",  # Taker 出 Token
    maker_amount_filled="500000",  # 0.5 USDC
    taker_amount_filled="1000000"  # 1.0 Token
)

try:
    trade1 = calculator.calculate_trade(event1)
    print(f"✓ 解析成功")
    print(f"  Token ID: {trade1.token_id}")
    print(f"  方向: {trade1.side}")
    print(f"  价格: {trade1.price}")
    print(f"  Maker 数量: {trade1.maker_amount_filled}")
    print(f"  Taker 数量: {trade1.taker_amount_filled}")

    # 验证结果
    assert trade1.side == "BUY", f"方向错误: 期望 BUY, 实际 {trade1.side}"
    assert trade1.token_id == "123456", f"Token ID 错误"
    expected_price = Decimal("0.5") / Decimal("1.0")
    actual_price = Decimal(trade1.price)
    assert actual_price == expected_price, f"价格错误: 期望 {expected_price}, 实际 {actual_price}"
    print("✓ 所有断言通过")
except Exception as e:
    print(f"✗ 测试失败: {e}")

# 测试用例 2: SELL 订单（Taker 出 USDC）
print("\n测试 2: SELL 订单")
print("-" * 80)
event2 = OrderFilledEvent(
    tx_hash="0xtest2",
    log_index=1,
    exchange="0x4bFb41d5B819043544C655D4DfAe3A8497B69b88",
    maker_asset_id="789012",  # Maker 出 Token
    taker_asset_id="0",  # Taker 出 USDC
    maker_amount_filled="2000000",  # 2.0 Token
    taker_amount_filled="1500000"  # 1.5 USDC
)

try:
    trade2 = calculator.calculate_trade(event2)
    print(f"✓ 解析成功")
    print(f"  Token ID: {trade2.token_id}")
    print(f"  方向: {trade2.side}")
    print(f"  价格: {trade2.price}")
    print(f"  Maker 数量: {trade2.maker_amount_filled}")
    print(f"  Taker 数量: {trade2.taker_amount_filled}")

    # 验证结果
    assert trade2.side == "SELL", f"方向错误: 期望 SELL, 实际 {trade2.side}"
    assert trade2.token_id == "789012", f"Token ID 错误"
    expected_price = Decimal("1.5") / Decimal("2.0")
    actual_price = Decimal(trade2.price)
    assert actual_price == expected_price, f"价格错误: 期望 {expected_price}, 实际 {actual_price}"
    print("✓ 所有断言通过")
except Exception as e:
    print(f"✗ 测试失败: {e}")

# 测试用例 3: 极小金额
print("\n测试 3: 极小金额")
print("-" * 80)
event3 = OrderFilledEvent(
    tx_hash="0xtest3",
    log_index=2,
    exchange="0x4bFb41d5B819043544C655D4DfAe3A8497B69b88",
    maker_asset_id="0",
    taker_asset_id="111111",
    maker_amount_filled="1",  # 0.000001 USDC
    taker_amount_filled="1"  # 0.000001 Token
)

try:
    trade3 = calculator.calculate_trade(event3)
    print(f"✓ 解析成功")
    print(f"  价格: {trade3.price}")
    assert trade3.price == "1.000000", f"价格错误: {trade3.price}"
    print("✓ 所有断言通过")
except Exception as e:
    print(f"✗ 测试失败: {e}")

# 测试用例 4: 极大金额
print("\n测试 4: 极大金额")
print("-" * 80)
event4 = OrderFilledEvent(
    tx_hash="0xtest4",
    log_index=3,
    exchange="0x4bFb41d5B819043544C655D4DfAe3A8497B69b88",
    maker_asset_id="0",
    taker_asset_id="222222",
    maker_amount_filled="1000000000000",  # 1,000,000 USDC
    taker_amount_filled="2000000000000"  # 2,000,000 Token
)

try:
    trade4 = calculator.calculate_trade(event4)
    print(f"✓ 解析成功")
    print(f"  价格: {trade4.price}")
    expected_price = Decimal("1000000") / Decimal("2000000")
    actual_price = Decimal(trade4.price)
    assert actual_price == expected_price, f"价格错误: 期望 {expected_price}, 实际 {actual_price}"
    print("✓ 所有断言通过")
except Exception as e:
    print(f"✗ 测试失败: {e}")

# 测试用例 5: 异常情况 - 双方都不是 USDC
print("\n测试 5: 异常情况 - 双方都不是 USDC")
print("-" * 80)
event5 = OrderFilledEvent(
    tx_hash="0xtest5",
    log_index=4,
    exchange="0x4bFb41d5B819043544C655D4DfAe3A8497B69b88",
    maker_asset_id="111111",
    taker_asset_id="222222",
    maker_amount_filled="1000000",
    taker_amount_filled="1000000"
)

try:
    trade5 = calculator.calculate_trade(event5)
    print(f"✗ 应该抛出异常但没有")
except ValueError as e:
    print(f"✓ 正确抛出异常: {e}")
except Exception as e:
    print(f"✗ 抛出了错误的异常类型: {e}")

print("\n" + "=" * 80)
print("单元测试完成")
print("=" * 80)
