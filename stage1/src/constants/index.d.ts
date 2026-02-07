import type { Address } from 'viem';
/**
 * Polymarket 相关的合约地址和常量
 */
/** USDC.e 代币地址（Polygon） */
export declare const USDC_ADDRESS: Address;
/** CTF Exchange 合约地址（普通二元市场） */
export declare const CTF_EXCHANGE_ADDRESS: Address;
/** NegRisk CTF Exchange 合约地址（负风险多结果市场） */
export declare const NEGRISK_EXCHANGE_ADDRESS: Address;
/** 交易所合约地址列表 */
export declare const EXCHANGE_ADDRESSES: Address[];
/** OrderFilled 事件的 ABI */
export declare const ORDER_FILLED_ABI: readonly [{
    readonly type: "event";
    readonly name: "OrderFilled";
    readonly inputs: readonly [{
        readonly name: "orderHash";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "maker";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "taker";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "makerAssetId";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "takerAssetId";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "makerAmountFilled";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "takerAmountFilled";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "fee";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}];
/** USDC 的小数位数 */
export declare const USDC_DECIMALS = 6;
/** 零地址（用于 parentCollectionId） */
export declare const ZERO_BYTES32: "0x0000000000000000000000000000000000000000000000000000000000000000";
//# sourceMappingURL=index.d.ts.map