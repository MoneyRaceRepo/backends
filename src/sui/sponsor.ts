import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';

// Support both bech32 (suiprivkey...) and hex (0x...) formats
let sponsorKeypair: Ed25519Keypair;

try {
  const key = process.env.SPONSOR_PRIVATE_KEY!;

  if (!key) {
    throw new Error('SPONSOR_PRIVATE_KEY not found in .env');
  }

  if (key.startsWith('suiprivkey')) {
    // Bech32 encoded private key (suiprivkey1...)
    const decoded = decodeSuiPrivateKey(key);
    sponsorKeypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
  } else if (key.startsWith('0x')) {
    // Hex encoded private key
    const hexKey = key.replace('0x', '');
    const secretKey = Uint8Array.from(Buffer.from(hexKey, 'hex'));
    sponsorKeypair = Ed25519Keypair.fromSecretKey(secretKey);
  } else {
    throw new Error('Invalid private key format. Use suiprivkey... or 0x...');
  }

  console.log('✅ Sponsor keypair loaded successfully');
  console.log('   Address:', sponsorKeypair.getPublicKey().toSuiAddress());
} catch (error: any) {
  console.error('❌ Failed to load sponsor keypair:', error.message);
  throw new Error(`SPONSOR_PRIVATE_KEY error: ${error.message}`);
}

export { sponsorKeypair };
