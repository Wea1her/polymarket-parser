/**
 * Fastify API Server
 *
 * 提供查询市场和交易数据的 REST API
 */
import Fastify from 'fastify';
import { getDatabase } from '../db/connection.js';
import { marketsRoutes } from './routes/markets.js';
import { eventsRoutes } from './routes/events.js';
/**
 * 创建 Fastify 服务器实例
 */
export async function createServer(dbPath, port = 8000) {
    const fastify = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
        },
    });
    // 初始化数据库连接
    const db = getDatabase(dbPath);
    fastify.decorate('db', db);
    // 注册路由前缀
    await fastify.register(marketsRoutes);
    await fastify.register(eventsRoutes);
    // 健康检查端点
    fastify.get('/health', async (request, reply) => {
        return {
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        };
    });
    // 根路径
    fastify.get('/', async (request, reply) => {
        return {
            name: 'Polymarket Indexer API',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                events: {
                    getEvent: '/events/:slug',
                    getEventMarkets: '/events/:slug/markets',
                },
                markets: {
                    getMarket: '/markets/:slug',
                    getMarketTrades: '/markets/:slug/trades',
                },
                tokens: {
                    getTokenTrades: '/tokens/:tokenId/trades',
                },
            },
        };
    });
    // 错误处理
    fastify.setErrorHandler((error, request, reply) => {
        fastify.log.error(error);
        const err = error;
        reply.status(500).send({
            error: 'Internal Server Error',
            message: err.message || '未知错误',
        });
    });
    // 404 处理
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            error: 'Not Found',
            message: `路由不存在: ${request.method} ${request.url}`,
        });
    });
    return fastify;
}
/**
 * 启动服务器
 */
export async function startServer(dbPath, port) {
    const serverPort = port || Number(process.env.API_PORT) || 8000;
    const fastify = await createServer(dbPath, serverPort);
    try {
        await fastify.listen({ port: serverPort, host: '0.0.0.0' });
        console.log(`\n✓ API 服务器启动成功: http://127.0.0.1:${serverPort}`);
        console.log(`  健康检查: http://127.0.0.1:${serverPort}/health`);
        console.log(`  API 文档: http://127.0.0.1:${serverPort}/\n`);
    }
    catch (err) {
        fastify.log.error(err);
        throw err;
    }
    return fastify;
}
/**
 * 命令行启动（当直接运行此文件时）
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    // 加载环境变量
    import('dotenv/config');
    const dbPath = process.argv[2] || process.env.DB_PATH;
    const port = process.argv[3] ? Number(process.argv[3]) : undefined;
    startServer(dbPath, port).catch((err) => {
        console.error('启动服务器失败:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map