/**
 * 数据库操作测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeDatabase, resetDatabase } from '../src/db/schema.js';
import * as store from '../src/db/store.js';

describe('数据库操作测试', () => {
  let db: Database.Database;

  beforeEach(() => {
    // 创建内存数据库
    db = new Database(':memory:');
    initializeDatabase(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('Events 表操作', () => {
    it('应该能够插入和查询事件', () => {
      const eventId = store.upsertEvent(db, {
        slug: 'test-event',
        title: '测试事件',
        description: '这是一个测试事件',
        neg_risk: 0,
      });

      expect(eventId).toBeGreaterThan(0);

      const event = store.getEventBySlug(db, 'test-event');
      expect(event).toBeDefined();
      expect(event?.slug).toBe('test-event');
      expect(event?.title).toBe('测试事件');
    });

    it('应该能够更新已存在的事件', () => {
      // 第一次插入
      store.upsertEvent(db, {
        slug: 'test-event',
        title: '原标题',
        description: null,
        neg_risk: 0,
      });

      // 第二次插入（更新）
      const eventId = store.upsertEvent(db, {
        slug: 'test-event',
        title: '新标题',
        description: '新描述',
        neg_risk: 1,
      });

      const event = store.getEventBySlug(db, 'test-event');
      expect(event?.title).toBe('新标题');
      expect(event?.description).toBe('新描述');
      expect(event?.neg_risk).toBe(1);
    });
  });

  describe('Markets 表操作', () => {
    it('应该能够插入和查询市场', () => {
      const marketId = store.upsertMarket(db, {
        event_id: null,
        slug: 'test-market',
        condition_id: '0xabc123',
        question_id: '0xdef456',
        oracle: '0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49',
        collateral_token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        yes_token_id: '0x111',
        no_token_id: '0x222',
        enable_neg_risk: 0,
        status: 'active',
      });

      expect(marketId).toBeGreaterThan(0);

      const market = store.getMarketBySlug(db, 'test-market');
      expect(market).toBeDefined();
      expect(market?.condition_id).toBe('0xabc123');
    });

    it('应该能够通过 tokenId 查找市场', () => {
      store.upsertMarket(db, {
        event_id: null,
        slug: 'test-market',
        condition_id: '0xabc123',
        question_id: '0xdef456',
        oracle: '0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49',
        collateral_token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        yes_token_id: '0x111',
        no_token_id: '0x222',
        enable_neg_risk: 0,
        status: 'active',
      });

      // 通过 YES tokenId 查找
      let market = store.findMarketByTokenId(db, '0x111');
      expect(market).toBeDefined();
      expect(market?.slug).toBe('test-market');

      // 通过 NO tokenId 查找
      market = store.findMarketByTokenId(db, '0x222');
      expect(market).toBeDefined();
      expect(market?.slug).toBe('test-market');

      // 不存在的 tokenId
      market = store.findMarketByTokenId(db, '0x999');
      expect(market).toBeNull();
    });
  });

  describe('Trades 表操作', () => {
    let marketId: number;

    beforeEach(() => {
      // 先创建一个市场
      marketId = store.upsertMarket(db, {
        event_id: null,
        slug: 'test-market',
        condition_id: '0xabc123',
        question_id: '0xdef456',
        oracle: '0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49',
        collateral_token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        yes_token_id: '0x111',
        no_token_id: '0x222',
        enable_neg_risk: 0,
        status: 'active',
      });
    });

    it('应该能够插入交易记录', () => {
      const tradeId = store.insertTrade(db, {
        market_id: marketId,
        tx_hash: '0xabc123',
        log_index: 0,
        block_number: 1000,
        block_hash: '0xblock',
        timestamp: '2024-01-01T00:00:00Z',
        maker: '0xmaker',
        taker: '0xtaker',
        side: 'BUY',
        outcome: 'YES',
        token_id: '0x111',
        price: '0.5',
        size: '100',
        maker_asset_id: '0',
        taker_asset_id: '0x111',
        maker_amount: '50000000',
        taker_amount: '100000000',
      });

      expect(tradeId).toBeGreaterThan(0);
    });

    it('应该防止重复插入相同的交易', () => {
      const trade = {
        market_id: marketId,
        tx_hash: '0xabc123',
        log_index: 0,
        block_number: 1000,
        block_hash: '0xblock',
        timestamp: '2024-01-01T00:00:00Z',
        maker: '0xmaker',
        taker: '0xtaker',
        side: 'BUY' as const,
        outcome: 'YES' as const,
        token_id: '0x111',
        price: '0.5',
        size: '100',
        maker_asset_id: '0',
        taker_asset_id: '0x111',
        maker_amount: '50000000',
        taker_amount: '100000000',
      };

      // 第一次插入
      const id1 = store.insertTrade(db, trade);
      expect(id1).toBeGreaterThan(0);

      // 第二次插入相同的交易（应该被忽略）
      const id2 = store.insertTrade(db, trade);
      expect(id2).toBeNull();
    });

    it('应该能够批量插入交易', () => {
      const trades = [
        {
          market_id: marketId,
          tx_hash: '0xabc123',
          log_index: 0,
          block_number: 1000,
          block_hash: '0xblock',
          timestamp: '2024-01-01T00:00:00Z',
          maker: '0xmaker',
          taker: '0xtaker',
          side: 'BUY' as const,
          outcome: 'YES' as const,
          token_id: '0x111',
          price: '0.5',
          size: '100',
          maker_asset_id: '0',
          taker_asset_id: '0x111',
          maker_amount: '50000000',
          taker_amount: '100000000',
        },
        {
          market_id: marketId,
          tx_hash: '0xabc123',
          log_index: 1,
          block_number: 1000,
          block_hash: '0xblock',
          timestamp: '2024-01-01T00:00:01Z',
          maker: '0xmaker2',
          taker: '0xtaker2',
          side: 'SELL' as const,
          outcome: 'NO' as const,
          token_id: '0x222',
          price: '0.6',
          size: '200',
          maker_asset_id: '0x222',
          taker_asset_id: '0',
          maker_amount: '200000000',
          taker_amount: '120000000',
        },
      ];

      const inserted = store.insertTrades(db, trades);
      expect(inserted).toBe(2);

      const count = store.getTradeCountForMarket(db, marketId);
      expect(count).toBe(2);
    });

    it('应该能够查询市场的交易记录', () => {
      // 插入一些交易
      for (let i = 0; i < 5; i++) {
        store.insertTrade(db, {
          market_id: marketId,
          tx_hash: `0xtx${i}`,
          log_index: i,
          block_number: 1000 + i,
          block_hash: '0xblock',
          timestamp: `2024-01-01T00:00:0${i}Z`,
          maker: '0xmaker',
          taker: '0xtaker',
          side: 'BUY',
          outcome: 'YES',
          token_id: '0x111',
          price: '0.5',
          size: '100',
          maker_asset_id: '0',
          taker_asset_id: '0x111',
          maker_amount: '50000000',
          taker_amount: '100000000',
        });
      }

      const result = store.getTradesForMarket(db, marketId, {
        limit: 3,
        offset: 0,
      });

      expect(result.trades.length).toBe(3);
      expect(result.total).toBe(5);
    });
  });

  describe('SyncState 表操作', () => {
    it('应该能够保存和读取同步状态', () => {
      store.updateSyncState(db, {
        key: 'trade_sync',
        last_block: 1000,
        last_block_hash: '0xblock',
      });

      const state = store.getSyncState(db, 'trade_sync');
      expect(state).toBeDefined();
      expect(state?.last_block).toBe(1000);
      expect(state?.last_block_hash).toBe('0xblock');
    });

    it('应该能够更新已存在的同步状态', () => {
      store.updateSyncState(db, {
        key: 'trade_sync',
        last_block: 1000,
        last_block_hash: '0xblock1',
      });

      store.updateSyncState(db, {
        key: 'trade_sync',
        last_block: 2000,
        last_block_hash: '0xblock2',
      });

      const state = store.getSyncState(db, 'trade_sync');
      expect(state?.last_block).toBe(2000);
      expect(state?.last_block_hash).toBe('0xblock2');
    });
  });
});
