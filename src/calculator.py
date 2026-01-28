"""价格计算器"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Literal
import structlog

from .models import OrderFilledEvent, ParsedTrade

logger = structlog.get_logger()


class PriceCalculator:
    """价格计算器"""

    # USDC 精度（6 位小数）
    USDC_DECIMALS = 6

    def calculate_trade(self, event: OrderFilledEvent) -> ParsedTrade:
        """
        计算交易价格和方向

        Args:
            event: OrderFilled 事件

        Returns:
            解析后的交易数据
        """
        # 识别 USDC 和 Token
        maker_asset_id = event.maker_asset_id
        taker_asset_id = event.taker_asset_id
        maker_amount = event.maker_amount_filled
        taker_amount = event.taker_amount_filled

        # 判断哪方是 USDC（assetId = "0"）
        if maker_asset_id == "0":
            # Maker 出 USDC，Taker 出 Token -> BUY
            usdc_amount = maker_amount
            token_amount = taker_amount
            token_id = taker_asset_id
            side: Literal["BUY", "SELL"] = "BUY"
        elif taker_asset_id == "0":
            # Taker 出 USDC，Maker 出 Token -> SELL
            usdc_amount = taker_amount
            token_amount = maker_amount
            token_id = maker_asset_id
            side = "SELL"
        else:
            raise ValueError(f"无效的交易：双方都不是 USDC (maker={maker_asset_id}, taker={taker_asset_id})")

        # 计算价格
        price = self._calculate_price(usdc_amount, token_amount)

        logger.info("交易计算完成",
                   tx_hash=event.tx_hash,
                   side=side,
                   price=price,
                   token_id=token_id)

        return ParsedTrade(
            tx_hash=event.tx_hash,
            log_index=event.log_index,
            exchange=event.exchange,
            maker=event.maker,
            taker=event.taker,
            maker_asset_id=event.maker_asset_id,
            taker_asset_id=event.taker_asset_id,
            maker_amount_filled=event.maker_amount_filled,
            taker_amount_filled=event.taker_amount_filled,
            price=price,
            token_id=token_id,
            side=side
        )

    def _calculate_price(self, usdc_amount: str, token_amount: str) -> str:
        """
        计算价格

        Args:
            usdc_amount: USDC 数量（最小单位）
            token_amount: Token 数量（最小单位）

        Returns:
            价格字符串
        """
        # 转换为 Decimal 避免浮点数误差
        usdc_decimal = Decimal(usdc_amount) / Decimal(10 ** self.USDC_DECIMALS)
        token_decimal = Decimal(token_amount) / Decimal(10 ** self.USDC_DECIMALS)

        if token_decimal == 0:
            raise ValueError("Token 数量不能为 0")

        # 计算价格
        price = usdc_decimal / token_decimal

        # 保留 6 位小数
        price = price.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)

        return str(price)
