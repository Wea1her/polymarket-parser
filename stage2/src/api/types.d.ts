/**
 * API 类型定义
 */
/** 查询交易的查询参数 */
export interface TradesQueryParams {
    limit?: number;
    cursor?: number;
    fromBlock?: number;
    toBlock?: number;
    side?: 'BUY' | 'SELL';
    outcome?: 'YES' | 'NO';
}
/** 路由参数 - slug */
export interface SlugParams {
    slug: string;
}
/** 路由参数 - tokenId */
export interface TokenIdParams {
    tokenId: string;
}
/** 错误响应 */
export interface ErrorResponse {
    error: string;
    message?: string;
}
/** 健康检查响应 */
export interface HealthResponse {
    status: 'ok';
    database: 'connected' | 'disconnected';
    timestamp: string;
}
//# sourceMappingURL=types.d.ts.map