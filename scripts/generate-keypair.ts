import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

/**
 * Generate a new Sui keypair for gas sponsorship
 * Run: npx ts-node scripts/generate-keypair.ts
 */

const keypair = new Ed25519Keypair();
const address = keypair.getPublicKey().toSuiAddress();
const privateKeyBase64 = keypair.getSecretKey();
const exportedKeypair = keypair.export();

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║         Sui Keypair Generated Successfully                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('📍 Sui Address:');
console.log(`   ${address}\n`);

console.log('🔐 Private Key (Base64 format):');
console.log(`   ${privateKeyBase64}\n`);

console.log('🔑 Exported Keypair (for backup):');
console.log(`   ${JSON.stringify(exportedKeypair)}\n`);

console.log('📝 Add this to your .env file:');
console.log(`   SPONSOR_PRIVATE_KEY=${privateKeyBase64}\n`);

console.log('💰 Fund this address with testnet SUI:');
console.log('   1. Visit: https://discord.com/channels/916379725201563759/971488439931392130');
console.log('   2. Or use: https://faucet.triangleplatform.com/sui/testnet\n');

console.log('⚠️  IMPORTANT: Keep your private key secure!');
console.log('   Never commit .env file to git\n');
