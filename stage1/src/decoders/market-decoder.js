import { USDC_ADDRESS, ZERO_BYTES32 } from '../constants/index.js';
import { getCollectionId, getPositionId, toHex, isValidBytes32, isValidAddress } from '../utils/hash.js';
/**
 * 市场解码器（任务 B）
 *
 * 根据 conditionId、questionId、oracle 等信息，计算市场的 YES 和 NO 头寸的 TokenId
 *
 * @param params - 市场参数
 * @param params.conditionId - 条件 ID
 * @param params.questionId - 问题 ID
 * @param params.oracle - 预言机地址
 * @param collateralToken - 抵押品代币地址（默认为 USDC）
 * @returns 市场解码结果，包含 YES 和 NO 的 TokenId
 *
 * @example
 * ```typescript
 * const market = decodeMarket({
 *   conditionId: '0xabc...123',
 *   questionId: '0xdef...456',
 *   oracle: '0x789...oracle'
 * });
 * console.log(market.yesTokenId); // YES 头寸的 TokenId
 * console.log(market.noTokenId);  // NO 头寸的 TokenId
 * ```
 */
export function decodeMarket(params, collateralToken = USDC_ADDRESS) {
    // 验证输入参数
    validateMarketParams(params);
    const { conditionId, questionId, oracle } = params;
    // 转换为 Hex 类型
    const conditionIdHex = toHex(conditionId);
    const questionIdHex = toHex(questionId);
    // 计算 YES 头寸的 CollectionId 和 TokenId
    // indexSet = 1 (0b01) 表示选取第一个结果槽
    const yesCollectionId = getCollectionId(ZERO_BYTES32, conditionIdHex, 1n);
    const yesTokenId = getPositionId(collateralToken, yesCollectionId);
    // 计算 NO 头寸的 CollectionId 和 TokenId
    // indexSet = 2 (0b10) 表示选取第二个结果槽
    const noCollectionId = getCollectionId(ZERO_BYTES32, conditionIdHex, 2n);
    const noTokenId = getPositionId(collateralToken, noCollectionId);
    return {
        conditionId: conditionIdHex,
        questionId: questionIdHex,
        oracle: oracle,
        collateralToken,
        yesTokenId,
        noTokenId,
    };
}
/**
 * 验证市场参数
 */
function validateMarketParams(params) {
    const { conditionId, questionId, oracle } = params;
    if (!conditionId || !isValidBytes32(conditionId)) {
        throw new Error(`无效的 conditionId: ${conditionId}。必须是 64 个十六进制字符（bytes32）`);
    }
    if (!questionId || !isValidBytes32(questionId)) {
        throw new Error(`无效的 questionId: ${questionId}。必须是 64 个十六进制字符（bytes32）`);
    }
    if (!oracle || !isValidAddress(oracle)) {
        throw new Error(`无效的 oracle 地址: ${oracle}。必须是 40 个十六进制字符（address）`);
    }
}
/**
 * 从 YES 或 NO TokenId 反向计算 CollectionId
 * （辅助函数，用于调试和验证）
 */
export function getCollectionIdFromTokenId(tokenId, collateralToken = USDC_ADDRESS) {
    // 注意：这实际上无法直接反向计算，因为 keccak256 是单向哈希
    // 这个函数主要用于文档说明，实际应用中需要从其他来源获取 collectionId
    throw new Error('无法从 TokenId 反向计算 CollectionId（keccak256 是单向哈希函数）');
}
//# sourceMappingURL=market-decoder.js.map