import { SuiClient } from '@mysten/sui.js/client';

export const suiClient = new SuiClient({
  url: process.env.SUI_RPC || 'https://fullnode.testnet.sui.io',
});
