/**
 * 数据库连接管理
 */
import Database from 'better-sqlite3';
/**
 * 获取或创建数据库连接
 */
export declare function getDatabase(dbPath?: string): Database.Database;
/**
 * 关闭数据库连接
 */
export declare function closeDatabase(): void;
/**
 * 创建新的数据库连接（用于测试）
 */
export declare function createDatabase(dbPath: string): Database.Database;
/**
 * 重置全局数据库实例
 */
export declare function resetDatabaseInstance(): void;
//# sourceMappingURL=connection.d.ts.map