import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import dotenv from 'dotenv';

dotenv.config();

const rpcUrl = process.env.SUI_RPC || 'https://fullnode.testnet.sui.io';
const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY!;

const { secretKey } = decodeSuiPrivateKey(sponsorPrivateKey);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);
const address = keypair.toSuiAddress();

const client = new SuiClient({ url: rpcUrl });

async function checkBalance() {
  console.log('============================================================');
  console.log('SPONSOR WALLET BALANCE');
  console.log('============================================================\n');
  console.log('Address:', address);
  console.log('Network:', rpcUrl);
  console.log('\n⏳ Checking balance...\n');

  const balance = await client.getBalance({
    owner: address,
  });

  const suiAmount = Number(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI

  console.log('💰 BALANCE:', balance.totalBalance, 'MIST');
  console.log('💰 BALANCE:', suiAmount, 'SUI');

  console.log('\n============================================================');
  if (suiAmount > 0) {
    console.log('✅ Wallet sudah terisi!');
    console.log('✅ Backend siap untuk sponsori gas fee!');
  } else {
    console.log('⚠️  Wallet masih kosong');
    console.log('⚠️  Isi dulu dengan faucet: https://docs.sui.io/guides/developer/getting-started/get-coins');
  }
  console.log('============================================================');
}

checkBalance().catch(console.error);
