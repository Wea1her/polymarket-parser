/**
 * 数据库表结构定义和初始化
 */
import type Database from 'better-sqlite3';
/**
 * 创建所有数据库表
 */
export declare function createTables(db: Database.Database): void;
/**
 * 创建所有索引以优化查询性能
 */
export declare function createIndexes(db: Database.Database): void;
/**
 * 初始化数据库结构
 */
export declare function initializeDatabase(db: Database.Database): void;
/**
 * 删除所有表（用于测试或重置）
 */
export declare function dropAllTables(db: Database.Database): void;
/**
 * 重置数据库（删除所有表并重新创建）
 */
export declare function resetDatabase(db: Database.Database): void;
//# sourceMappingURL=schema.d.ts.map