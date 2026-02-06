import { SuiClient } from '@mysten/sui/client';
import { config } from '../config/index.js';

export const suiClient = new SuiClient({
  url: config.suiRpc,
});

console.log('✓ Sui Client initialized:', {
  network: config.network,
  rpc: config.suiRpc,
});

/**
 * Test RPC connection
 */
export async function testRpcConnection(): Promise<boolean> {
  try {
    const chainId = await suiClient.getChainIdentifier();
    console.log('✓ RPC Connection successful!', {
      chainId,
      network: config.network,
    });
    return true;
  } catch (error: any) {
    console.error('✗ RPC Connection failed:', {
      error: error.message,
      rpc: config.suiRpc,
    });
    return false;
  }
}

/**
 * Test Smart Contract connection
 * Checks if Package ID and Admin Cap are accessible
 */
export async function testSmartContractConnection(): Promise<boolean> {
  try {
    console.log('\n📦 Checking Smart Contract...');

    // Check if Package ID is configured
    if (!config.packageId) {
      console.error('✗ Package ID not configured in .env');
      return false;
    }

    // Check if Admin Cap ID is configured
    if (!config.adminCapId) {
      console.error('✗ Admin Cap ID not configured in .env');
      return false;
    }

    console.log('Package ID:', config.packageId);
    console.log('Admin Cap ID:', config.adminCapId);

    // Try to get the package object
    try {
      const packageObj = await suiClient.getObject({
        id: config.packageId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (packageObj.data) {
        console.log('✓ Package found on blockchain!', {
          objectId: packageObj.data.objectId,
          version: packageObj.data.version,
        });
      } else {
        console.error('✗ Package not found on blockchain');
        return false;
      }
    } catch (error: any) {
      console.error('✗ Failed to fetch package:', error.message);
      return false;
    }

    // Try to get the Admin Cap object
    try {
      const adminCapObj = await suiClient.getObject({
        id: config.adminCapId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      if (adminCapObj.data) {
        console.log('✓ Admin Cap found on blockchain!', {
          objectId: adminCapObj.data.objectId,
          type: adminCapObj.data.type,
          owner: adminCapObj.data.owner,
        });
      } else {
        console.error('✗ Admin Cap not found on blockchain');
        return false;
      }
    } catch (error: any) {
      console.error('✗ Failed to fetch Admin Cap:', error.message);
      return false;
    }

    console.log('✓ Smart Contract connection successful!\n');
    return true;
  } catch (error: any) {
    console.error('✗ Smart Contract connection failed:', error.message);
    return false;
  }
}
