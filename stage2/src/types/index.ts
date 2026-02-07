/**
 * 全局类型定义
 */

// ============ 数据库表类型 ============

/** 事件表记录 */
export interface EventRecord {
  id: number;
  slug: string;
  title: string | null;
  description: string | null;
  neg_risk: number; // 0 或 1
  created_at: string;
  updated_at: string;
}

/** 市场表记录 */
export interface MarketRecord {
  id: number;
  event_id: number | null;
  slug: string;
  condition_id: string;
  question_id: string;
  oracle: string;
  collateral_token: string;
  yes_token_id: string;
  no_token_id: string;
  enable_neg_risk: number; // 0 或 1
  status: string; // 'active' | 'closed' | 'resolved'
  created_at: string;
  updated_at: string;
}

/** 交易表记录 */
export interface TradeRecord {
  id: number;
  market_id: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_hash: string;
  timestamp: string;
  maker: string;
  taker: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  token_id: string;
  price: string;
  size: string;
  maker_asset_id: string;
  taker_asset_id: string;
  maker_amount: string;
  taker_amount: string;
  created_at: string;
}

/** 同步状态表记录 */
export interface SyncStateRecord {
  key: string;
  last_block: number;
  last_block_hash: string | null;
  updated_at: string;
}

// ============ 插入/更新类型（Omit id 和自动生成的字段）============

export type EventInsert = Omit<EventRecord, 'id' | 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type MarketInsert = Omit<MarketRecord, 'id' | 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type TradeInsert = Omit<TradeRecord, 'id' | 'created_at'> & {
  created_at?: string;
};

export type SyncStateInsert = SyncStateRecord;

// ============ Gamma API 响应类型 ============

/** Gamma API 事件响应 */
export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  negRisk?: boolean;
  markets?: GammaMarket[];
  createdAt?: string;
  updatedAt?: string;
}

/** Gamma API 市场响应 */
export interface GammaMarket {
  id: string;
  slug: string;
  question: string;
  description?: string;
  conditionId: string;
  questionId: string;
  clobTokenIds: string[]; // [yesTokenId, noTokenId]
  outcomeTokens?: string[];
  outcomes?: string[];
  outcomePrices?: string[];
  volume?: string;
  active?: boolean;
  closed?: boolean;
  enableOrderBook?: boolean;
  negRisk?: boolean;
  archived?: boolean;
  acceptingOrders?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // 注意：Gamma API 可能不直接提供 oracle 字段，需要从其他地方获取
}

// ============ 索引器相关类型 ============

/** 同步结果 */
export interface SyncResult {
  totalTrades: number;
  processedBlocks: number;
  fromBlock: number;
  toBlock: number;
  errors?: string[];
}

/** 区块信息 */
export interface BlockInfo {
  timestamp: bigint;
  hash: string;
}

/** 查询交易的过滤器 */
export interface TradeFilters {
  limit?: number;
  offset?: number;
  fromBlock?: number;
  toBlock?: number;
  side?: 'BUY' | 'SELL';
  outcome?: 'YES' | 'NO';
}

/** 交易查询结果 */
export interface TradesQueryResult {
  trades: TradeRecord[];
  total: number;
}

// ============ API 响应类型 ============

/** API 事件响应 */
export interface ApiEvent {
  id: number;
  slug: string;
  title: string;
  description?: string;
  negRisk: boolean;
  marketCount?: number;
  createdAt: string;
}

/** API 市场响应 */
export interface ApiMarket {
  id: number;
  slug: string;
  conditionId: string;
  questionId: string;
  oracle: string;
  collateralToken: string;
  yesTokenId: string;
  noTokenId: string;
  status: string;
  enableNegRisk: boolean;
  tradeCount?: number;
  createdAt: string;
}

/** API 交易响应 */
export interface ApiTrade {
  id: number;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  timestamp: string;
  maker: string;
  taker: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  tokenId: string;
  price: string;
  size: string;
}

/** API 分页交易响应 */
export interface ApiTradesResponse {
  trades: ApiTrade[];
  total: number;
  nextCursor?: number;
}
