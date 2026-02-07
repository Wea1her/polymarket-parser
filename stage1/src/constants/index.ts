import type { Address } from 'viem';

/**
 * Polymarket 相关的合约地址和常量
 */

/** USDC.e 代币地址（Polygon） */
export const USDC_ADDRESS: Address = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

/** CTF Exchange 合约地址（普通二元市场） */
export const CTF_EXCHANGE_ADDRESS: Address = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

/** NegRisk CTF Exchange 合约地址（负风险多结果市场） */
export const NEGRISK_EXCHANGE_ADDRESS: Address = '0xC5d563A36AE78145C45a50134d48A1215220f80a';

/** 交易所合约地址列表 */
export const EXCHANGE_ADDRESSES: Address[] = [
  CTF_EXCHANGE_ADDRESS,
  NEGRISK_EXCHANGE_ADDRESS,
];

/** OrderFilled 事件的 ABI */
export const ORDER_FILLED_ABI = [
  {
    type: 'event',
    name: 'OrderFilled',
    inputs: [
      {
        name: 'orderHash',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'maker',
        type: 'address',
        indexed: true,
      },
      {
        name: 'taker',
        type: 'address',
        indexed: true,
      },
      {
        name: 'makerAssetId',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'takerAssetId',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'makerAmountFilled',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'takerAmountFilled',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'fee',
        type: 'uint256',
        indexed: false,
      },
    ],
  },
] as const;

/** USDC 的小数位数 */
export const USDC_DECIMALS = 6;

/** 零地址（用于 parentCollectionId） */
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

