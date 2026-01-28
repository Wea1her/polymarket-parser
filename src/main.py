"""主程序入口"""
import sys
import json
import structlog
from typing import List

from .rpc_client import RPCClient
from .parser import EventParser
from .calculator import PriceCalculator
from .models import ParsedTrade

# 配置日志
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()


class PolymarketParser:
    """Polymarket 交易解析器主类"""

    def __init__(self, rpc_url: str = None):
        """初始化解析器"""
        self.rpc_client = RPCClient(rpc_url)
        self.event_parser = EventParser()
        self.price_calculator = PriceCalculator()

    def parse_transaction(self, tx_hash: str) -> List[ParsedTrade]:
        """
        解析单笔交易

        Args:
            tx_hash: 交易哈希

        Returns:
            解析后的交易列表
        """
        logger.info("开始解析交易", tx_hash=tx_hash)

        # 1. 获取交易回执
        receipt = self.rpc_client.get_transaction_receipt(tx_hash)

        # 2. 过滤 OrderFilled 事件
        order_filled_logs = self.event_parser.filter_order_filled_events(receipt)

        if not order_filled_logs:
            logger.warning("未找到 OrderFilled 事件", tx_hash=tx_hash)
            return []

        # 3. 解析每个事件
        parsed_trades = []
        for log in order_filled_logs:
            event = self.event_parser.parse_event(log, tx_hash)
            if event:
                # 4. 计算价格和方向
                trade = self.price_calculator.calculate_trade(event)
                parsed_trades.append(trade)

        logger.info("交易解析完成", tx_hash=tx_hash, trade_count=len(parsed_trades))
        return parsed_trades


def main():
    """命令行入口"""
    if len(sys.argv) < 2:
        print("用法: python -m src.main <tx_hash>")
        sys.exit(1)

    tx_hash = sys.argv[1]

    try:
        parser = PolymarketParser()

        # 检查连接
        if not parser.rpc_client.is_connected():
            print("错误: 无法连接到 RPC 节点")
            sys.exit(1)

        # 解析交易
        trades = parser.parse_transaction(tx_hash)

        # 输出结果
        if trades:
            print("\n解析结果:")
            print("=" * 80)
            for trade in trades:
                print(json.dumps(trade.model_dump(), indent=2, ensure_ascii=False))
                print("-" * 80)
        else:
            print("未找到 OrderFilled 事件")

    except Exception as e:
        logger.error("解析失败", error=str(e))
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
