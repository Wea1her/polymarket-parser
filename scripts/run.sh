#!/bin/bash
# Polymarket 交易解析器启动脚本

set -e

# 检查参数
if [ $# -lt 1 ]; then
    echo "用法: $0 <tx_hash> [rpc_url]"
    exit 1
fi

TX_HASH=$1
RPC_URL=${2:-"https://polygon-rpc.com"}

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 设置环境变量
export POLYGON_RPC_URL=$RPC_URL

# 运行解析器
uv run python -m src.main "$TX_HASH"
