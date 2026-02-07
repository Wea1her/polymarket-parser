/**
 * 错误重试工具
 */
/**
 * 等待指定的毫秒数
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * 使用指数退避策略重试函数
 *
 * @param fn - 要重试的异步函数
 * @param maxRetries - 最大重试次数（默认 5）
 * @param initialDelay - 初始延迟毫秒数（默认 1000）
 * @returns 函数执行结果
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await fetchData(),
 *   3,
 *   500
 * );
 * ```
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, initialDelay?: number): Promise<T>;
/**
 * 带超时的 Promise 包装器
 *
 * @param promise - 要执行的 Promise
 * @param timeoutMs - 超时时间（毫秒）
 * @param errorMessage - 超时错误消息
 * @returns Promise 结果
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T>;
/**
 * 批量执行异步任务，带并发控制
 *
 * @param tasks - 任务数组
 * @param concurrency - 并发数量
 * @param onProgress - 进度回调（可选）
 * @returns 所有任务结果
 */
export declare function batchExecute<T, R>(tasks: T[], fn: (task: T) => Promise<R>, concurrency?: number, onProgress?: (completed: number, total: number) => void): Promise<R[]>;
//# sourceMappingURL=retry.d.ts.map