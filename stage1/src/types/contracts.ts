import type { Address } from 'viem';

/**
 * OrderFilled 事件的参数类型
 */
export interface OrderFilledEvent {
  orderHash: `0x${string}`;
  maker: Address;
  taker: Address;
  makerAssetId: bigint;
  takerAssetId: bigint;
  makerAmountFilled: bigint;
  takerAmountFilled: bigint;
  fee: bigint;
}

