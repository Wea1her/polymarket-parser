/**
 * 数据访问层（CRUD 操作）
 */
// ============ Events 表操作 ============
/**
 * 插入或更新事件
 */
export function upsertEvent(db, event) {
    const stmt = db.prepare(`
    INSERT INTO events (slug, title, description, neg_risk, created_at, updated_at)
    VALUES (@slug, @title, @description, @neg_risk, @created_at, @updated_at)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      neg_risk = excluded.neg_risk,
      updated_at = excluded.updated_at
    RETURNING id
  `);
    const now = new Date().toISOString();
    const result = stmt.get({
        slug: event.slug,
        title: event.title ?? null,
        description: event.description ?? null,
        neg_risk: event.neg_risk,
        created_at: event.created_at ?? now,
        updated_at: event.updated_at ?? now,
    });
    return result.id;
}
/**
 * 根据 slug 获取事件
 */
export function getEventBySlug(db, slug) {
    const stmt = db.prepare('SELECT * FROM events WHERE slug = ?');
    return stmt.get(slug) ?? null;
}
/**
 * 获取所有事件
 */
export function getAllEvents(db) {
    const stmt = db.prepare('SELECT * FROM events ORDER BY created_at DESC');
    return stmt.all();
}
// ============ Markets 表操作 ============
/**
 * 插入或更新市场
 */
export function upsertMarket(db, market) {
    const stmt = db.prepare(`
    INSERT INTO markets (
      event_id, slug, condition_id, question_id, oracle,
      collateral_token, yes_token_id, no_token_id,
      enable_neg_risk, status, created_at, updated_at
    )
    VALUES (
      @event_id, @slug, @condition_id, @question_id, @oracle,
      @collateral_token, @yes_token_id, @no_token_id,
      @enable_neg_risk, @status, @created_at, @updated_at
    )
    ON CONFLICT(slug) DO UPDATE SET
      event_id = excluded.event_id,
      condition_id = excluded.condition_id,
      question_id = excluded.question_id,
      oracle = excluded.oracle,
      collateral_token = excluded.collateral_token,
      yes_token_id = excluded.yes_token_id,
      no_token_id = excluded.no_token_id,
      enable_neg_risk = excluded.enable_neg_risk,
      status = excluded.status,
      updated_at = excluded.updated_at
    RETURNING id
  `);
    const now = new Date().toISOString();
    const result = stmt.get({
        event_id: market.event_id ?? null,
        slug: market.slug,
        condition_id: market.condition_id,
        question_id: market.question_id,
        oracle: market.oracle,
        collateral_token: market.collateral_token,
        yes_token_id: market.yes_token_id,
        no_token_id: market.no_token_id,
        enable_neg_risk: market.enable_neg_risk,
        status: market.status,
        created_at: market.created_at ?? now,
        updated_at: market.updated_at ?? now,
    });
    return result.id;
}
/**
 * 根据 slug 获取市场
 */
export function getMarketBySlug(db, slug) {
    const stmt = db.prepare('SELECT * FROM markets WHERE slug = ?');
    return stmt.get(slug) ?? null;
}
/**
 * 根据 tokenId 查找市场（可能是 yes 或 no）
 */
export function findMarketByTokenId(db, tokenId) {
    const stmt = db.prepare(`
    SELECT * FROM markets 
    WHERE yes_token_id = ? OR no_token_id = ?
    LIMIT 1
  `);
    return stmt.get(tokenId, tokenId) ?? null;
}
/**
 * 根据 conditionId 获取市场
 */
export function getMarketByConditionId(db, conditionId) {
    const stmt = db.prepare('SELECT * FROM markets WHERE condition_id = ?');
    return stmt.get(conditionId) ?? null;
}
/**
 * 获取事件下的所有市场
 */
export function getMarketsByEventId(db, eventId) {
    const stmt = db.prepare(`
    SELECT * FROM markets 
    WHERE event_id = ?
    ORDER BY created_at DESC
  `);
    return stmt.all(eventId);
}
/**
 * 获取所有市场
 */
export function getAllMarkets(db) {
    const stmt = db.prepare('SELECT * FROM markets ORDER BY created_at DESC');
    return stmt.all();
}
// ============ Trades 表操作 ============
/**
 * 插入单个交易（幂等）
 */
export function insertTrade(db, trade) {
    const stmt = db.prepare(`
    INSERT OR IGNORE INTO trades (
      market_id, tx_hash, log_index, block_number, block_hash,
      timestamp, maker, taker, side, outcome, token_id,
      price, size, maker_asset_id, taker_asset_id,
      maker_amount, taker_amount, created_at
    )
    VALUES (
      @market_id, @tx_hash, @log_index, @block_number, @block_hash,
      @timestamp, @maker, @taker, @side, @outcome, @token_id,
      @price, @size, @maker_asset_id, @taker_asset_id,
      @maker_amount, @taker_amount, @created_at
    )
  `);
    const now = new Date().toISOString();
    const result = stmt.run({
        market_id: trade.market_id,
        tx_hash: trade.tx_hash,
        log_index: trade.log_index,
        block_number: trade.block_number,
        block_hash: trade.block_hash,
        timestamp: trade.timestamp,
        maker: trade.maker,
        taker: trade.taker,
        side: trade.side,
        outcome: trade.outcome,
        token_id: trade.token_id,
        price: trade.price,
        size: trade.size,
        maker_asset_id: trade.maker_asset_id,
        taker_asset_id: trade.taker_asset_id,
        maker_amount: trade.maker_amount,
        taker_amount: trade.taker_amount,
        created_at: trade.created_at ?? now,
    });
    // 如果插入成功，返回 lastInsertRowid，否则返回 null
    return result.changes > 0 ? Number(result.lastInsertRowid) : null;
}
/**
 * 批量插入交易（使用事务）
 */
export function insertTrades(db, trades) {
    if (trades.length === 0)
        return 0;
    const insertMany = db.transaction((trades) => {
        let inserted = 0;
        for (const trade of trades) {
            const result = insertTrade(db, trade);
            if (result !== null)
                inserted++;
        }
        return inserted;
    });
    return insertMany(trades);
}
/**
 * 获取市场的交易记录（带过滤和分页）
 */
export function getTradesForMarket(db, marketId, filters = {}) {
    const { limit = 100, offset = 0, fromBlock, toBlock, side, outcome, } = filters;
    // 构建查询条件
    const conditions = ['market_id = ?'];
    const params = [marketId];
    if (fromBlock !== undefined) {
        conditions.push('block_number >= ?');
        params.push(fromBlock);
    }
    if (toBlock !== undefined) {
        conditions.push('block_number <= ?');
        params.push(toBlock);
    }
    if (side) {
        conditions.push('side = ?');
        params.push(side);
    }
    if (outcome) {
        conditions.push('outcome = ?');
        params.push(outcome);
    }
    const whereClause = conditions.join(' AND ');
    // 查询总数
    const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM trades WHERE ${whereClause}
  `);
    const { count } = countStmt.get(...params);
    // 查询数据
    const dataStmt = db.prepare(`
    SELECT * FROM trades 
    WHERE ${whereClause}
    ORDER BY block_number DESC, log_index DESC
    LIMIT ? OFFSET ?
  `);
    const trades = dataStmt.all(...params, limit, offset);
    return { trades, total: count };
}
/**
 * 根据 tokenId 获取交易记录
 */
export function getTradesByTokenId(db, tokenId, filters = {}) {
    const { limit = 100, offset = 0, fromBlock, toBlock, side, outcome } = filters;
    // 构建查询条件
    const conditions = ['token_id = ?'];
    const params = [tokenId];
    if (fromBlock !== undefined) {
        conditions.push('block_number >= ?');
        params.push(fromBlock);
    }
    if (toBlock !== undefined) {
        conditions.push('block_number <= ?');
        params.push(toBlock);
    }
    if (side) {
        conditions.push('side = ?');
        params.push(side);
    }
    if (outcome) {
        conditions.push('outcome = ?');
        params.push(outcome);
    }
    const whereClause = conditions.join(' AND ');
    // 查询总数
    const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM trades WHERE ${whereClause}
  `);
    const { count } = countStmt.get(...params);
    // 查询数据
    const dataStmt = db.prepare(`
    SELECT * FROM trades 
    WHERE ${whereClause}
    ORDER BY block_number DESC, log_index DESC
    LIMIT ? OFFSET ?
  `);
    const trades = dataStmt.all(...params, limit, offset);
    return { trades, total: count };
}
/**
 * 获取示例交易（用于演示）
 */
export function getSampleTrades(db, limit = 5) {
    const stmt = db.prepare(`
    SELECT * FROM trades 
    ORDER BY block_number DESC, log_index DESC
    LIMIT ?
  `);
    return stmt.all(limit);
}
/**
 * 统计市场的交易数量
 */
export function getTradeCountForMarket(db, marketId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM trades WHERE market_id = ?');
    const { count } = stmt.get(marketId);
    return count;
}
// ============ Sync State 表操作 ============
/**
 * 获取同步状态
 */
export function getSyncState(db, key) {
    const stmt = db.prepare('SELECT * FROM sync_state WHERE key = ?');
    return stmt.get(key) ?? null;
}
/**
 * 更新同步状态
 */
export function updateSyncState(db, state) {
    const stmt = db.prepare(`
    INSERT INTO sync_state (key, last_block, last_block_hash, updated_at)
    VALUES (@key, @last_block, @last_block_hash, @updated_at)
    ON CONFLICT(key) DO UPDATE SET
      last_block = excluded.last_block,
      last_block_hash = excluded.last_block_hash,
      updated_at = excluded.updated_at
  `);
    stmt.run({
        key: state.key,
        last_block: state.last_block,
        last_block_hash: state.last_block_hash ?? null,
        updated_at: new Date().toISOString(),
    });
}
/**
 * 删除同步状态
 */
export function deleteSyncState(db, key) {
    const stmt = db.prepare('DELETE FROM sync_state WHERE key = ?');
    stmt.run(key);
}
//# sourceMappingURL=store.js.map