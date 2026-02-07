/**
 * 交易解码结果类型
 */
export interface TradeDecoded {
    /** 交易哈希 */
    txHash: string;
    /** 日志索引 */
    logIndex: number;
    /** 交易所合约地址 */
    exchange: string;
    /** 挂单方地址 */
    maker: string;
    /** 吃单方地址 */
    taker: string;
    /** maker 给出的资产 ID（0 表示 USDC，非零表示头寸 TokenId） */
    makerAssetId: string;
    /** taker 给出的资产 ID */
    takerAssetId: string;
    /** maker 支付的资产数量（整数形式） */
    makerAmountFilled: string;
    /** taker 支付的资产数量（整数形式） */
    takerAmountFilled: string;
    /** 成交价格（USDC per share） */
    price: string;
    /** 本次交易涉及的 Outcome Token 的 ID */
    tokenId: string;
    /** 买卖方向（BUY: 买入头寸，SELL: 卖出头寸） */
    side: "BUY" | "SELL";
}
/**
 * 市场解码结果类型
 */
export interface MarketDecoded {
    /** 条件 ID（链上唯一标识） */
    conditionId: string;
    /** 问题 ID */
    questionId: string;
    /** 预言机合约地址 */
    oracle: string;
    /** 抵押品代币地址（通常为 USDC） */
    collateralToken: string;
    /** YES 头寸的 TokenId */
    yesTokenId: string;
    /** NO 头寸的 TokenId */
    noTokenId: string;
}
/**
 * 市场解码输入参数
 */
export interface MarketDecodeParams {
    /** 条件 ID */
    conditionId: string;
    /** 问题 ID */
    questionId: string;
    /** 预言机地址 */
    oracle: string;
}
//# sourceMappingURL=index.d.ts.map