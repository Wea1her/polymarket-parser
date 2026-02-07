import { type Address, type Hex } from 'viem';
/**
 * 计算 CollectionId
 *
 * 根据 Gnosis Conditional Token Framework 的规范：
 * collectionId = keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet))
 *
 * @param parentCollectionId - 父集合 ID（对于独立条件通常为 0x0）
 * @param conditionId - 条件 ID
 * @param indexSet - 结果索引集合（1 表示 YES，2 表示 NO）
 * @returns CollectionId
 */
export declare function getCollectionId(parentCollectionId: Hex, conditionId: Hex, indexSet: bigint): Hex;
/**
 * 计算 PositionId (TokenId)
 *
 * 根据 CTF 规范：
 * positionId = keccak256(abi.encodePacked(collateralToken, collectionId))
 *
 * @param collateralToken - 抵押品代币地址（Polymarket 中为 USDC）
 * @param collectionId - 集合 ID
 * @returns PositionId (TokenId)
 */
export declare function getPositionId(collateralToken: Address, collectionId: Hex): Hex;
/**
 * 辅助函数：将字符串转换为 Hex 类型
 */
export declare function toHex(value: string): Hex;
/**
 * 辅助函数：验证是否为有效的 bytes32
 */
export declare function isValidBytes32(value: string): boolean;
/**
 * 辅助函数：验证是否为有效的地址
 */
export declare function isValidAddress(value: string): boolean;
//# sourceMappingURL=hash.d.ts.map