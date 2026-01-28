"""RPC 客户端"""
import time
from typing import Optional
from web3 import Web3
from web3.exceptions import Web3Exception
from web3.middleware import ExtraDataToPOAMiddleware
import structlog

from .config import settings

logger = structlog.get_logger()


class RPCClient:
    """Polygon RPC 客户端"""

    def __init__(self, rpc_url: Optional[str] = None):
        """初始化 RPC 客户端"""
        self.rpc_url = rpc_url or settings.polygon_rpc_url
        self.w3 = Web3(Web3.HTTPProvider(
            self.rpc_url,
            request_kwargs={'timeout': settings.rpc_timeout}
        ))
        # 添加 POA 中间件以支持 Polygon
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.max_retries = settings.rpc_max_retries

    def get_transaction_receipt(self, tx_hash: str) -> dict:
        """
        获取交易回执

        Args:
            tx_hash: 交易哈希

        Returns:
            交易回执字典

        Raises:
            Exception: RPC 调用失败
        """
        for attempt in range(self.max_retries):
            try:
                logger.info("获取交易回执", tx_hash=tx_hash, attempt=attempt + 1)
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                logger.info("成功获取交易回执", tx_hash=tx_hash, log_count=len(receipt['logs']))
                return dict(receipt)
            except Web3Exception as e:
                logger.warning("RPC 调用失败", tx_hash=tx_hash, attempt=attempt + 1, error=str(e))
                if attempt < self.max_retries - 1:
                    time.sleep(1 * (attempt + 1))  # 指数退避
                else:
                    raise Exception(f"RPC 调用失败，已重试 {self.max_retries} 次: {e}")

    def is_connected(self) -> bool:
        """检查 RPC 连接状态"""
        try:
            return self.w3.is_connected()
        except Exception:
            return False
