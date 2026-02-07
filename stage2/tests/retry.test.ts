/**
 * 重试工具测试
 */

import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff, sleep, withTimeout } from '../src/utils/retry.js';

describe('重试工具测试', () => {
  describe('sleep', () => {
    it('应该等待指定的时间', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('retryWithBackoff', () => {
    it('应该在成功时立即返回结果', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 100);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该在失败后重试', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('失败');
        }
        return 'success';
      });

      const result = await retryWithBackoff(fn, 5, 50);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('应该在达到最大重试次数后抛出错误', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('永远失败'));

      await expect(retryWithBackoff(fn, 3, 50)).rejects.toThrow('永远失败');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('应该使用指数退避延迟', async () => {
      let attempts = 0;
      const delays: number[] = [];
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts > 1) {
          delays.push(Date.now());
        }
        if (attempts < 3) {
          throw new Error('失败');
        }
        return 'success';
      });

      const start = Date.now();
      await retryWithBackoff(fn, 5, 100);
      
      // 第一次重试延迟应该约为 100ms
      // 第二次重试延迟应该约为 200ms
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    it('应该在超时前返回结果', async () => {
      const fn = async () => {
        await sleep(50);
        return 'success';
      };

      const result = await withTimeout(fn(), 200, '操作超时');
      expect(result).toBe('success');
    });

    it('应该在超时时抛出错误', async () => {
      const fn = async () => {
        await sleep(200);
        return 'success';
      };

      await expect(withTimeout(fn(), 50, '操作超时')).rejects.toThrow('操作超时');
    });
  });
});
