import { describe, it, expect } from 'vitest';
import { decodeMarket } from '../src/decoders/market-decoder.js';
import { USDC_ADDRESS } from '../src/constants/index.js';
import marketSample from './fixtures/market_sample.json';

describe('市场解码器测试', () => {
  describe('decodeMarket', () => {
    it('应该成功解码市场参数', () => {
      const result = decodeMarket({
        conditionId: marketSample.market.conditionId,
        questionId: marketSample.market.questionId,
        oracle: marketSample.market.oracle,
      });

      // 验证基本字段
      expect(result.conditionId).toBe(marketSample.market.conditionId);
      expect(result.questionId).toBe(marketSample.market.questionId);
      expect(result.oracle).toBe(marketSample.market.oracle);
      expect(result.collateralToken).toBe(USDC_ADDRESS);

      // 验证 tokenId 格式
      expect(result.yesTokenId).toMatch(/^0x[0-9a-f]{64}$/);
      expect(result.noTokenId).toMatch(/^0x[0-9a-f]{64}$/);

      // YES 和 NO tokenId 应该不同
      expect(result.yesTokenId).not.toBe(result.noTokenId);
    });

    it('应该拒绝无效的 conditionId', () => {
      expect(() => {
        decodeMarket({
          conditionId: '0xinvalid',
          questionId: marketSample.market.questionId,
          oracle: marketSample.market.oracle,
        });
      }).toThrow(/无效的 conditionId/);
    });

    it('应该拒绝无效的 questionId', () => {
      expect(() => {
        decodeMarket({
          conditionId: marketSample.market.conditionId,
          questionId: '0xshort',
          oracle: marketSample.market.oracle,
        });
      }).toThrow(/无效的 questionId/);
    });

    it('应该拒绝无效的 oracle 地址', () => {
      expect(() => {
        decodeMarket({
          conditionId: marketSample.market.conditionId,
          questionId: marketSample.market.questionId,
          oracle: '0xinvalid',
        });
      }).toThrow(/无效的 oracle 地址/);
    });

    it('应该接受没有 0x 前缀的有效输入', () => {
      const conditionId = '1'.repeat(64);
      const questionId = '2'.repeat(64);
      const oracle = '1234567890123456789012345678901234567890';

      const result = decodeMarket({
        conditionId,
        questionId,
        oracle,
      });

      // 输出应该带有 0x 前缀
      expect(result.conditionId).toBe(`0x${conditionId}`);
      expect(result.questionId).toBe(`0x${questionId}`);
    });

    it('相同的输入应该产生相同的 tokenId（确定性）', () => {
      const params = {
        conditionId: marketSample.market.conditionId,
        questionId: marketSample.market.questionId,
        oracle: marketSample.market.oracle,
      };

      const result1 = decodeMarket(params);
      const result2 = decodeMarket(params);

      expect(result1.yesTokenId).toBe(result2.yesTokenId);
      expect(result1.noTokenId).toBe(result2.noTokenId);
    });
  });
});

