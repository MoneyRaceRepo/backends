import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Check if sponsor address has been funded
 * Run: npx ts-node scripts/fund-check.ts
 */

async function checkBalance() {
  const rpcUrl = process.env.SUI_RPC || 'https://fullnode.testnet.sui.io';
  const privateKey = process.env.SPONSOR_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ SPONSOR_PRIVATE_KEY not found in .env');
    process.exit(1);
  }

  try {
    const client = new SuiClient({ url: rpcUrl });

    // Recreate keypair from private key (Base64 format)
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const address = keypair.getPublicKey().toSuiAddress();

    console.log('\n📍 Checking balance for:');
    console.log(`   ${address}\n`);

    const balance = await client.getBalance({ owner: address });
    const suiBalance = Number(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI

    console.log('💰 Balance:');
    console.log(`   ${suiBalance} SUI\n`);

    if (suiBalance === 0) {
      console.log('⚠️  Address needs funding!');
      console.log('\n📝 Fund this address:');
      console.log('   1. Copy address above');
      console.log('   2. Visit: https://faucet.triangleplatform.com/sui/testnet');
      console.log('   3. Paste address and request testnet SUI');
      console.log('   4. Run this script again to verify\n');
    } else if (suiBalance < 1) {
      console.log('⚠️  Low balance! Consider adding more SUI for gas fees\n');
    } else {
      console.log('✅ Address funded! Ready to sponsor transactions\n');
    }

  } catch (error) {
    console.error('❌ Error checking balance:', error);
    process.exit(1);
  }
}

checkBalance();
