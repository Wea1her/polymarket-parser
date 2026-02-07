import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 获取 Polygon RPC URL
 * 优先使用环境变量，否则使用默认公共 RPC
 */
const getRpcUrl = (): string => {
  const envUrl = process.env.POLYGON_RPC_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 使用公共 RPC 作为后备
  console.warn('警告: 未配置 POLYGON_RPC_URL 环境变量，使用公共 RPC（可能不稳定）');
  return 'https://polygon-rpc.com';
};

/**
 * Polygon 公共客户端
 * 用于读取链上数据
 */
export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(getRpcUrl()),
});

/**
 * 创建自定义的 Public Client
 * @param rpcUrl - 自定义 RPC URL
 */
export function createCustomClient(rpcUrl: string) {
  return createPublicClient({
    chain: polygon,
    transport: http(rpcUrl),
  });
}

