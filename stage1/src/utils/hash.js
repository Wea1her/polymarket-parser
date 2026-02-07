import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
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
export function getCollectionId(parentCollectionId, conditionId, indexSet) {
    const encoded = encodeAbiParameters(parseAbiParameters('bytes32, bytes32, uint256'), [parentCollectionId, conditionId, indexSet]);
    return keccak256(encoded);
}
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
export function getPositionId(collateralToken, collectionId) {
    // 需要使用 encodePacked 的方式，地址是 20 字节，collectionId 是 32 字节
    // viem 中 encodePacked 的实现方式
    const encoded = encodeAbiParameters(parseAbiParameters('address, bytes32'), [collateralToken, collectionId]);
    return keccak256(encoded);
}
/**
 * 辅助函数：将字符串转换为 Hex 类型
 */
export function toHex(value) {
    if (!value.startsWith('0x')) {
        return `0x${value}`;
    }
    return value;
}
/**
 * 辅助函数：验证是否为有效的 bytes32
 */
export function isValidBytes32(value) {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(hex);
}
/**
 * 辅助函数：验证是否为有效的地址
 */
export function isValidAddress(value) {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{40}$/.test(hex);
}
//# sourceMappingURL=hash.js.map