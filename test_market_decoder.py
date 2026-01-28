"""市场解码器单元测试"""
import sys
import json
from pathlib import Path

# 添加 src 目录到路径
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.market_decoder import MarketDecoder


def test_basic_calculation():
    """测试基本的 TokenId 计算"""
    print("\n=== 测试 1: 基本 TokenId 计算 ===")

    decoder = MarketDecoder()

    # 使用一个示例 conditionId
    condition_id = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    market_params = decoder.decode_market(
        condition_id=condition_id,
        question_id="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        oracle="0x1234567890123456789012345678901234567890"
    )

    print(f"Condition ID: {market_params.conditionId}")
    print(f"Question ID: {market_params.questionId}")
    print(f"Oracle: {market_params.oracle}")
    print(f"Collateral Token: {market_params.collateralToken}")
    print(f"YES Token ID: {market_params.yesTokenId}")
    print(f"NO Token ID: {market_params.noTokenId}")

    # 验证基本属性
    assert market_params.conditionId == condition_id.lower()
    assert market_params.yesTokenId != market_params.noTokenId
    assert len(market_params.yesTokenId) > 0
    assert len(market_params.noTokenId) > 0

    print("✅ 基本计算测试通过")


def test_token_id_verification():
    """测试 TokenId 验证功能"""
    print("\n=== 测试 2: TokenId 验证 ===")

    decoder = MarketDecoder()

    condition_id = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    market_params = decoder.decode_market(condition_id)

    # 验证 YES TokenId
    assert decoder.verify_token_id(market_params.yesTokenId, condition_id)
    print(f"✅ YES TokenId 验证通过: {market_params.yesTokenId}")

    # 验证 NO TokenId
    assert decoder.verify_token_id(market_params.noTokenId, condition_id)
    print(f"✅ NO TokenId 验证通过: {market_params.noTokenId}")

    # 验证无效的 TokenId
    invalid_token_id = "999999999999999999999999999999999999999999999999999999999999999999"
    assert not decoder.verify_token_id(invalid_token_id, condition_id)
    print(f"✅ 无效 TokenId 验证通过")


def test_different_condition_ids():
    """测试不同的 conditionId 产生不同的 TokenId"""
    print("\n=== 测试 3: 不同 conditionId 产生不同 TokenId ===")

    decoder = MarketDecoder()

    condition_id_1 = "0x1111111111111111111111111111111111111111111111111111111111111111"
    condition_id_2 = "0x2222222222222222222222222222222222222222222222222222222222222222"

    market_1 = decoder.decode_market(condition_id_1)
    market_2 = decoder.decode_market(condition_id_2)

    # 验证不同的 conditionId 产生不同的 TokenId
    assert market_1.yesTokenId != market_2.yesTokenId
    assert market_1.noTokenId != market_2.noTokenId

    print(f"Market 1 YES: {market_1.yesTokenId}")
    print(f"Market 2 YES: {market_2.yesTokenId}")
    print(f"✅ 不同 conditionId 产生不同 TokenId")


def test_json_output():
    """测试 JSON 输出格式"""
    print("\n=== 测试 4: JSON 输出格式 ===")

    decoder = MarketDecoder()

    condition_id = "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1"
    question_id = "0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4"
    oracle = "0x1234567890123456789012345678901234567890"

    market_params = decoder.decode_market(
        condition_id=condition_id,
        question_id=question_id,
        oracle=oracle
    )

    # 转换为 JSON
    json_output = market_params.model_dump()

    print(json.dumps(json_output, indent=2))

    # 验证 JSON 格式
    assert "conditionId" in json_output
    assert "questionId" in json_output
    assert "oracle" in json_output
    assert "collateralToken" in json_output
    assert "yesTokenId" in json_output
    assert "noTokenId" in json_output

    print("✅ JSON 输出格式正确")


def test_hex_normalization():
    """测试十六进制字符串标准化"""
    print("\n=== 测试 5: 十六进制字符串标准化 ===")

    decoder = MarketDecoder()

    # 测试不同格式的输入
    test_cases = [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0X1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    ]

    results = []
    for condition_id in test_cases:
        market_params = decoder.decode_market(condition_id)
        results.append(market_params.yesTokenId)
        print(f"Input: {condition_id}")
        print(f"YES TokenId: {market_params.yesTokenId}")

    # 验证所有格式产生相同的结果
    assert all(r == results[0] for r in results)
    print("✅ 十六进制字符串标准化正确")


def test_collateral_token_override():
    """测试自定义抵押品代币"""
    print("\n=== 测试 6: 自定义抵押品代币 ===")

    # 使用默认 USDC.e
    decoder_usdc = MarketDecoder()

    # 使用自定义抵押品代币
    custom_token = "0x1111111111111111111111111111111111111111"
    decoder_custom = MarketDecoder(collateral_token=custom_token)

    condition_id = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    market_usdc = decoder_usdc.decode_market(condition_id)
    market_custom = decoder_custom.decode_market(condition_id)

    # 验证不同的抵押品代币产生不同的 TokenId
    assert market_usdc.yesTokenId != market_custom.yesTokenId
    assert market_usdc.noTokenId != market_custom.noTokenId

    print(f"USDC YES TokenId: {market_usdc.yesTokenId}")
    print(f"Custom YES TokenId: {market_custom.yesTokenId}")
    print("✅ 自定义抵押品代币测试通过")


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("市场解码器单元测试")
    print("=" * 60)

    try:
        test_basic_calculation()
        test_token_id_verification()
        test_different_condition_ids()
        test_json_output()
        test_hex_normalization()
        test_collateral_token_override()

        print("\n" + "=" * 60)
        print("✅ 所有测试通过！")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        raise
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        raise


if __name__ == "__main__":
    run_all_tests()
