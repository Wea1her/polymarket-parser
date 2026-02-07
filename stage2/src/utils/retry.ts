/**
 * 错误重试工具
 */

/**
 * 等待指定的毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 最后一次尝试失败，直接抛出错误
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // 计算延迟时间（指数增长）
      const delay = initialDelay * Math.pow(2, attempt);
      
      console.warn(
        `重试 ${attempt + 1}/${maxRetries}，等待 ${delay}ms (错误: ${lastError.message})`
      );

      await sleep(delay);
    }
  }

  // TypeScript 类型检查需要，实际上不会到达这里
  throw lastError!;
}

/**
 * 带超时的 Promise 包装器
 * 
 * @param promise - 要执行的 Promise
 * @param timeoutMs - 超时时间（毫秒）
 * @param errorMessage - 超时错误消息
 * @returns Promise 结果
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = '操作超时'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${errorMessage} (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

/**
 * 批量执行异步任务，带并发控制
 * 
 * @param tasks - 任务数组
 * @param concurrency - 并发数量
 * @param onProgress - 进度回调（可选）
 * @returns 所有任务结果
 */
export async function batchExecute<T, R>(
  tasks: T[],
  fn: (task: T) => Promise<R>,
  concurrency: number = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  let completed = 0;

  for (const task of tasks) {
    const promise = fn(task).then((result) => {
      results.push(result);
      completed++;
      if (onProgress) {
        onProgress(completed, tasks.length);
      }
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // 移除已完成的 Promise
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
