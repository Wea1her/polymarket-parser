"""数据模型定义"""
from pydantic import BaseModel, Field
from typing import Literal


class OrderFilledEvent(BaseModel):
    """OrderFilled 事件原始数据"""
    tx_hash: str = Field(description="交易哈希")
    log_index: int = Field(description="日志索引")
    exchange: str = Field(description="交易所合约地址")
    maker: str = Field(description="挂单方地址")
    taker: str = Field(description="吃单方地址")
    maker_asset_id: str = Field(description="挂单方资产ID")
    taker_asset_id: str = Field(description="吃单方资产ID")
    maker_amount_filled: str = Field(description="挂单方成交数量")
    taker_amount_filled: str = Field(description="吃单方成交数量")


class ParsedTrade(BaseModel):
    """解析后的交易数据"""
    txHash: str = Field(alias="tx_hash")
    logIndex: int = Field(alias="log_index")
    exchange: str
    maker: str
    taker: str
    makerAssetId: str = Field(alias="maker_asset_id")
    takerAssetId: str = Field(alias="taker_asset_id")
    makerAmountFilled: str = Field(alias="maker_amount_filled")
    takerAmountFilled: str = Field(alias="taker_amount_filled")
    price: str
    tokenId: str = Field(alias="token_id")
    side: Literal["BUY", "SELL"]

    class Config:
        populate_by_name = True
