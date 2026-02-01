import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import dotenv from 'dotenv';

dotenv.config();

const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY!;

const { secretKey } = decodeSuiPrivateKey(sponsorPrivateKey);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

console.log('============================================================');
console.log('SPONSOR WALLET (Backend Wallet untuk Gas Fee)');
console.log('============================================================\n');
console.log('✅ PRIVATE KEY (rahasia, sudah ada di .env):');
console.log(sponsorPrivateKey);
console.log('\n✅ ADDRESS (public):');
console.log(keypair.toSuiAddress());
console.log('\n✅ PUBLIC KEY:');
console.log(keypair.getPublicKey().toBase64());
console.log('\n============================================================');
console.log('⚠️  PENTING:');
console.log('- Private key sudah aman di .env');
console.log('- Address ini perlu diisi SUI testnet token untuk bayar gas');
console.log('- Cara isi: https://docs.sui.io/guides/developer/getting-started/get-coins');
console.log('============================================================');
