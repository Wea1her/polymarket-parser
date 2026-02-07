/**
 * Fastify API Server
 *
 * 提供查询市场和交易数据的 REST API
 */
import type { FastifyInstance } from 'fastify';
import type Database from 'better-sqlite3';
declare module 'fastify' {
    interface FastifyInstance {
        db: Database.Database;
    }
}
/**
 * 创建 Fastify 服务器实例
 */
export declare function createServer(dbPath?: string, port?: number): Promise<FastifyInstance>;
/**
 * 启动服务器
 */
export declare function startServer(dbPath?: string, port?: number): Promise<FastifyInstance>;
//# sourceMappingURL=server.d.ts.map