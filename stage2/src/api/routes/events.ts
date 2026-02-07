/**
 * 事件相关 API 路由
 */

import type { FastifyPluginAsync } from 'fastify';
import type Database from 'better-sqlite3';
import * as store from '../../db/store.js';
import type { SlugParams } from '../types.js';
import type { ApiEvent } from '../../types/index.js';

/**
 * 将数据库的 EventRecord 转换为 API 响应格式
 */
function toApiEvent(event: any, marketCount?: number): ApiEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title || event.slug,
    description: event.description,
    negRisk: event.neg_risk === 1,
    marketCount,
    createdAt: event.created_at,
  };
}

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as Database.Database;

  /**
   * GET /events/:slug
   * 获取事件详情
   */
  fastify.get<{ Params: SlugParams }>(
    '/events/:slug',
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

      const event = store.getEventBySlug(db, slug);

      if (!event) {
        return reply.code(404).send({
          error: 'Event not found',
          message: `事件不存在: ${slug}`,
        });
      }

      // 获取市场数量
      const markets = store.getMarketsByEventId(db, event.id);
      const marketCount = markets.length;

      return toApiEvent(event, marketCount);
    }
  );

  /**
   * GET /events/:slug/markets
   * 获取事件下的所有市场
   */
  fastify.get<{ Params: SlugParams }>(
    '/events/:slug/markets',
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

      // 查找事件
      const event = store.getEventBySlug(db, slug);
      if (!event) {
        return reply.code(404).send({
          error: 'Event not found',
          message: `事件不存在: ${slug}`,
        });
      }

      // 获取事件下的所有市场
      const markets = store.getMarketsByEventId(db, event.id);

      // 转换为 API 格式
      const apiMarkets = markets.map((market) => ({
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
      }));

      return {
        markets: apiMarkets,
        total: markets.length,
      };
    }
  );
};
