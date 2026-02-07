import { describe, it, expect } from 'vitest';
import { getCollectionId, getPositionId, toHex, isValidBytes32, isValidAddress } from '../src/utils/hash.js';
import { USDC_ADDRESS, ZERO_BYTES32 } from '../src/constants/index.js';

describe('Hash 工具函数测试', () => {
  describe('toHex', () => {
    it('应该正确转换没有 0x 前缀的字符串', () => {
      const result = toHex('1234');
      expect(result).toBe('0x1234');
    });

    it('应该保持已有 0x 前缀的字符串', () => {
      const result = toHex('0x1234');
      expect(result).toBe('0x1234');
    });
  });

  describe('isValidBytes32', () => {
    it('应该验证有效的 bytes32', () => {
      const valid = '0x' + '1'.repeat(64);
      expect(isValidBytes32(valid)).toBe(true);
    });

    it('应该验证没有 0x 前缀的有效 bytes32', () => {
      const valid = '1'.repeat(64);
      expect(isValidBytes32(valid)).toBe(true);
    });

    it('应该拒绝长度不正确的字符串', () => {
      expect(isValidBytes32('0x1234')).toBe(false);
    });

    it('应该拒绝包含非十六进制字符的字符串', () => {
      const invalid = '0x' + 'g'.repeat(64);
      expect(isValidBytes32(invalid)).toBe(false);
    });
  });

  describe('isValidAddress', () => {
    it('应该验证有效的地址', () => {
      expect(isValidAddress(USDC_ADDRESS)).toBe(true);
    });

    it('应该拒绝长度不正确的地址', () => {
      expect(isValidAddress('0x1234')).toBe(false);
    });
  });

  describe('getCollectionId', () => {
    it('应该计算有效的 collectionId', () => {
      const conditionId = '0x' + '1'.repeat(64);
      const indexSet = 1n;

      const collectionId = getCollectionId(ZERO_BYTES32 as `0x${string}`, conditionId as `0x${string}`, indexSet);

      // 验证返回值是有效的 bytes32
      expect(collectionId).toMatch(/^0x[0-9a-f]{64}$/);
      expect(collectionId).not.toBe(ZERO_BYTES32);
    });

    it('不同的 indexSet 应该产生不同的 collectionId', () => {
      const conditionId = '0x' + '2'.repeat(64);

      const yesCollectionId = getCollectionId(ZERO_BYTES32 as `0x${string}`, conditionId as `0x${string}`, 1n);
      const noCollectionId = getCollectionId(ZERO_BYTES32 as `0x${string}`, conditionId as `0x${string}`, 2n);

      expect(yesCollectionId).not.toBe(noCollectionId);
    });
  });

  describe('getPositionId', () => {
    it('应该计算有效的 positionId', () => {
      const collectionId = '0x' + '3'.repeat(64);

      const positionId = getPositionId(USDC_ADDRESS, collectionId as `0x${string}`);

      // 验证返回值是有效的 bytes32
      expect(positionId).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('不同的 collectionId 应该产生不同的 positionId', () => {
      const collectionId1 = '0x' + '4'.repeat(64);
      const collectionId2 = '0x' + '5'.repeat(64);

      const positionId1 = getPositionId(USDC_ADDRESS, collectionId1 as `0x${string}`);
      const positionId2 = getPositionId(USDC_ADDRESS, collectionId2 as `0x${string}`);

      expect(positionId1).not.toBe(positionId2);
    });
  });
});

