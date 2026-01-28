"""配置管理"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置"""
    # RPC 配置
    polygon_rpc_url: str = "https://polygon-rpc.com"
    rpc_timeout: int = 30
    rpc_max_retries: int = 3

    # 合约配置 - 通过真实交易验证的地址
    ctf_exchange_address: str = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
    negrisk_exchange_address: str = "0xC5d563A36AE78145C45a50134d48A1215220f80a"

    # 日志配置
    log_level: str = "INFO"
    log_file: str = "logs/parser.log"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()
