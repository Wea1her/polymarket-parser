/**
 * 市场相关 API 路由
 */

import type { FastifyPluginAsync } from 'fastify';
import type Database from 'better-sqlite3';
import * as store from '../../db/store.js';
import type {
  SlugParams,
  TokenIdParams,
  TradesQueryParams,
} from '../types.js';
import type {
  ApiMarket,
  ApiTradesResponse,
  ApiTrade,
} from '../../types/index.js';

/**
 * 将数据库的 MarketRecord 转换为 API 响应格式
 */
function toApiMarket(market: any): ApiMarket {
  return {
    id: market.id,
    slug: market.slug,
    conditionId: market.condition_id,
    questionId: market.question_id,
    oracle: market.oracle,
    collateralToken: market.collateral_token,
    yesTokenId: market.yes_token_id,
    noTokenId: market.no_token_id,
    status: market.status,
    enableNegRisk: market.enable_neg_risk === 1,
    createdAt: market.created_at,
  };
}

/**
 * 将数据库的 TradeRecord 转换为 API 响应格式
 */
function toApiTrade(trade: any): ApiTrade {
  return {
    id: trade.id,
    txHash: trade.tx_hash,
    logIndex: trade.log_index,
    blockNumber: trade.block_number,
    timestamp: trade.timestamp,
    maker: trade.maker,
    taker: trade.taker,
    side: trade.side,
    outcome: trade.outcome,
    tokenId: trade.token_id,
    price: trade.price,
    size: trade.size,
  };
}

export const marketsRoutes: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as Database.Database;

  /**
   * GET /markets/:slug
   * 获取市场详情
   */
  fastify.get<{ Params: SlugParams }>(
    '/markets/:slug',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
          required: ['slug'],
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params;

      const market = store.getMarketBySlug(db, slug);

      if (!market) {
        return reply.code(404).send({
          error: 'Market not found',
          message: `市场不存在: ${slug}`,
        });
      }

      // 获取交易数量
      const tradeCount = store.getTradeCountForMarket(db, market.id);

      return {
        ...toApiMarket(market),
        tradeCount,
      };
    }
  );

  /**
   * GET /markets/:slug/trades
   * 获取市场的交易记录（带分页和过滤）
   */
  fastify.get<{
    Params: SlugParams;
    Querystring: TradesQueryParams;
  }>(
    '/markets/:slug/trades',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
          required: ['slug'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
            cursor: { type: 'number', minimum: 0, default: 0 },
            fromBlock: { type: 'number' },
            toBlock: { type: 'number' },
            side: { type: 'string', enum: ['BUY', 'SELL'] },
            outcome: { type: 'string', enum: ['YES', 'NO'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params;
      const {
        limit = 100,
        cursor = 0,
        fromBlock,
        toBlock,
        side,
        outcome,
      } = request.query;

      // 查找市场
      const market = store.getMarketBySlug(db, slug);
      if (!market) {
        return reply.code(404).send({
          error: 'Market not found',
          message: `市场不存在: ${slug}`,
        });
      }

      // 查询交易
      const result = store.getTradesForMarket(db, market.id, {
        limit: Math.min(limit, 1000),
        offset: cursor,
        fromBlock,
        toBlock,
        side,
        outcome,
      });

      // 转换为 API 格式
      const trades = result.trades.map(toApiTrade);

      const response: ApiTradesResponse = {
        trades,
        total: result.total,
        nextCursor:
          cursor + trades.length < result.total
            ? cursor + trades.length
            : undefined,
      };

      return response;
    }
  );

  /**
   * GET /tokens/:tokenId/trades
   * 按 TokenId 获取交易记录
   */
  fastify.get<{
    Params: TokenIdParams;
    Querystring: TradesQueryParams;
  }>(
    '/tokens/:tokenId/trades',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            tokenId: { type: 'string' },
          },
          required: ['tokenId'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
            cursor: { type: 'number', minimum: 0, default: 0 },
            fromBlock: { type: 'number' },
            toBlock: { type: 'number' },
            side: { type: 'string', enum: ['BUY', 'SELL'] },
            outcome: { type: 'string', enum: ['YES', 'NO'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { tokenId } = request.params;
      const {
        limit = 100,
        cursor = 0,
        fromBlock,
        toBlock,
        side,
        outcome,
      } = request.query;

      // 查询交易
      const result = store.getTradesByTokenId(db, tokenId, {
        limit: Math.min(limit, 1000),
        offset: cursor,
        fromBlock,
        toBlock,
        side,
        outcome,
      });

      // 转换为 API 格式
      const trades = result.trades.map(toApiTrade);

      const response: ApiTradesResponse = {
        trades,
        total: result.total,
        nextCursor:
          cursor + trades.length < result.total
            ? cursor + trades.length
            : undefined,
      };

      return response;
    }
  );
};
