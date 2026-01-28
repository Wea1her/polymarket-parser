"""事件解析器"""
from typing import List, Optional
from web3 import Web3
import structlog

from .models import OrderFilledEvent
from .config import settings

logger = structlog.get_logger()


class EventParser:
    """事件解析器"""

    # OrderFilled 事件签名（需要通过测试确认）
    ORDER_FILLED_SIGNATURE = "OrderFilled(bytes32,address,address,uint256,uint256,uint256,uint256,uint256)"

    def __init__(self):
        """初始化解析器"""
        self.supported_exchanges = {
            settings.ctf_exchange_address.lower(),
            settings.negrisk_exchange_address.lower()
        }
        # 计算事件主题哈希
        self.order_filled_topic = Web3.keccak(text=self.ORDER_FILLED_SIGNATURE).hex()
        logger.info("事件解析器初始化", topic=self.order_filled_topic)

    def filter_order_filled_events(self, receipt: dict) -> List[dict]:
        """
        从交易回执中过滤 OrderFilled 事件

        Args:
            receipt: 交易回执

        Returns:
            OrderFilled 事件日志列表
        """
        logs = receipt.get('logs', [])
        filtered_logs = []

        for log in logs:
            # 检查合约地址
            address = log.get('address', '').lower()
            if address not in self.supported_exchanges:
                continue

            # 检查事件主题
            topics = log.get('topics', [])
            if not topics:
                continue

            # topics[0] 是事件签名哈希
            event_topic = topics[0].hex() if hasattr(topics[0], 'hex') else topics[0]
            if event_topic == self.order_filled_topic:
                filtered_logs.append(log)
                logger.info("找到 OrderFilled 事件",
                           address=address,
                           log_index=log.get('logIndex'))

        logger.info("事件过滤完成", total_logs=len(logs), filtered=len(filtered_logs))
        return filtered_logs

    def parse_event(self, log: dict, tx_hash: str) -> Optional[OrderFilledEvent]:
        """
        解析单个 OrderFilled 事件

        Args:
            log: 事件日志
            tx_hash: 交易哈希

        Returns:
            解析后的事件对象
        """
        try:
            # 提取基本信息
            log_index = log.get('logIndex', 0)
            exchange = log.get('address', '')

            # 提取 topics 中的地址
            # topics: [event_signature, orderHash, maker, taker]
            topics = log.get('topics', [])
            if len(topics) < 4:
                logger.error("Topics 数量不足", topic_count=len(topics))
                return None

            # 提取 maker 和 taker 地址（topics[2] 和 topics[3]）
            maker_topic = topics[2].hex() if hasattr(topics[2], 'hex') else topics[2]
            taker_topic = topics[3].hex() if hasattr(topics[3], 'hex') else topics[3]

            # 地址在 topic 中是 32 字节，实际地址是后 20 字节（40 个十六进制字符）
            maker = '0x' + maker_topic[-40:]
            taker = '0x' + taker_topic[-40:]

            # 解析数据字段
            # data: makerAssetId, takerAssetId, makerAmountFilled, takerAmountFilled, fee
            data = log.get('data', '0x')

            # 转换为十六进制字符串（处理 HexBytes 对象）
            if hasattr(data, 'hex'):
                data_hex = data.hex()
            else:
                data_hex = str(data)

            # 移除 0x 前缀
            if data_hex.startswith('0x'):
                data_hex = data_hex[2:]

            # 每个 uint256 占 64 个十六进制字符（32 字节）
            if len(data_hex) < 64 * 4:
                logger.error("数据长度不足", data_length=len(data_hex))
                return None

            # 解析各个字段
            maker_asset_id = str(int(data_hex[0:64], 16))
            taker_asset_id = str(int(data_hex[64:128], 16))
            maker_amount_filled = str(int(data_hex[128:192], 16))
            taker_amount_filled = str(int(data_hex[192:256], 16))

            event = OrderFilledEvent(
                tx_hash=tx_hash,
                log_index=log_index,
                exchange=exchange,
                maker=maker,
                taker=taker,
                maker_asset_id=maker_asset_id,
                taker_asset_id=taker_asset_id,
                maker_amount_filled=maker_amount_filled,
                taker_amount_filled=taker_amount_filled
            )

            logger.info("事件解析成功",
                       tx_hash=tx_hash,
                       log_index=log_index,
                       maker_asset_id=maker_asset_id,
                       taker_asset_id=taker_asset_id)

            return event

        except Exception as e:
            logger.error("事件解析失败", error=str(e), log=log)
            return None
