/**
 * Test Script: Create a Test Room
 *
 * This script will create a test room on the blockchain
 * and return the Room ID that you can use for testing
 *
 * Usage: npx tsx src/test-create-room.ts
 */

import { relayerService } from './services/relayer.service.js';
import { config } from './config/index.js';

async function createTestRoom() {
  console.log('🚀 Creating Test Room on Blockchain...\n');

  console.log('Network:', config.network);
  console.log('Package ID:', config.packageId);
  console.log('');

  // Check if package is configured
  if (!config.packageId) {
    console.error('❌ Package ID not configured!');
    console.log('💡 Please set PACKAGE_ID in backend/.env');
    return;
  }

  // Test room parameters
  const testRoomParams = {
    totalPeriods: 4,           // 4 weeks
    depositAmount: 1000000,    // 1 USDC (6 decimals)
    strategyId: 1,             // Strategy 1
    startTimeMs: Date.now() + 60000, // Start in 1 minute
    periodLengthMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  };

  console.log('📋 Room Parameters:');
  console.log('  - Total Periods:', testRoomParams.totalPeriods, 'weeks');
  console.log('  - Deposit Amount:', testRoomParams.depositAmount / 1000000, 'USDC');
  console.log('  - Strategy ID:', testRoomParams.strategyId);
  console.log('  - Start Time:', new Date(testRoomParams.startTimeMs).toISOString());
  console.log('  - Period Length:', testRoomParams.periodLengthMs / (24 * 60 * 60 * 1000), 'days');
  console.log('');

  try {
    console.log('⏳ Creating room...');
    const result = await relayerService.createRoom(testRoomParams);

    if (!result.success) {
      console.error('❌ Failed to create room');
      console.log('Result:', result);
      return;
    }

    console.log('✅ Room Created Successfully!\n');
    console.log('Transaction Digest:', result.digest);
    console.log('');

    // Parse created objects from effects
    if (result.effects?.created && result.effects.created.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 Created Objects:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      result.effects.created.forEach((obj: any, index: number) => {
        console.log(`\n${index + 1}. ${obj.objectType || 'Unknown Type'}`);
        console.log('   Object ID:', obj.reference?.objectId);
        console.log('   Owner:', obj.owner);

        // Check if this is the Room object
        const objectType = obj.objectType || '';
        if (objectType.includes('Room') || objectType.includes('room')) {
          console.log('   ⭐ THIS IS YOUR ROOM ID! ⭐');
        }
      });
    }

    // Parse object changes
    if (result.effects?.objectChanges && result.effects.objectChanges.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 Object Changes:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const roomObject = result.effects.objectChanges.find((change: any) =>
        change.type === 'created' &&
        change.objectType &&
        (change.objectType.includes('Room') || change.objectType.includes('room'))
      );

      if (roomObject) {
        console.log('\n⭐ ROOM CREATED! ⭐');
        console.log('Room ID:', roomObject.objectId);
        console.log('Type:', roomObject.objectType);
        console.log('Owner:', roomObject.owner);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Next Steps:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Test fetching this room:');
        console.log(`   npx tsx src/test-fetch-room.ts`);
        console.log(`   (Update ROOM_ID to: ${roomObject.objectId})`);
        console.log('\n2. Or test via API:');
        console.log(`   curl http://localhost:3001/room/${roomObject.objectId}`);
        console.log('\n3. Or test in frontend:');
        console.log(`   http://localhost:3000/room/${roomObject.objectId}`);
        console.log('');
      } else {
        console.log('\n⚠️  Could not automatically find Room object ID');
        console.log('Please check the created objects above');
      }
    }

    // View on explorer
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 View Transaction:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`https://suiscan.xyz/${config.network}/tx/${result.digest}`);
    console.log('');

  } catch (error: any) {
    console.error('❌ Error creating room:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure PACKAGE_ID is correct in .env');
    console.log('   - Make sure smart contract is deployed');
    console.log('   - Check if sponsor has enough SUI for gas');
  }
}

// Run the test
createTestRoom().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});
