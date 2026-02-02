/**
 * Test Script: Find Rooms on Blockchain
 *
 * This script will search for Room objects created by the sponsor address
 *
 * Usage: npx tsx src/test-find-rooms.ts
 */

import { suiClient } from './sui/client.js';
import { config } from './config/index.js';
import { sponsorKeypair } from './sui/sponsor.js';

async function findRooms() {
  console.log('🔍 Searching for Rooms on Blockchain...\n');

  const sponsorAddress = sponsorKeypair.toSuiAddress();
  console.log('Sponsor Address:', sponsorAddress);
  console.log('Network:', config.network);
  console.log('Package ID:', config.packageId || 'not configured');
  console.log('');

  try {
    // Get all objects owned by sponsor
    console.log('Fetching objects owned by sponsor...');
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: sponsorAddress,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });

    console.log(`Found ${ownedObjects.data.length} objects\n`);

    // Filter for Room objects
    const roomObjects = ownedObjects.data.filter((obj) => {
      const type = obj.data?.type;
      return type && (
        type.includes('Room') ||
        type.includes('room') ||
        (config.packageId && type.includes(config.packageId))
      );
    });

    if (roomObjects.length === 0) {
      console.log('❌ No Room objects found!');
      console.log('💡 Create a room first using POST /room/create endpoint\n');

      // Show all object types for debugging
      console.log('📦 All object types found:');
      const uniqueTypes = new Set(
        ownedObjects.data
          .map(obj => obj.data?.type)
          .filter(Boolean)
      );
      uniqueTypes.forEach(type => console.log(`  - ${type}`));

      return;
    }

    console.log(`✅ Found ${roomObjects.length} Room object(s)!\n`);

    // Display each room
    roomObjects.forEach((obj, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Room ${index + 1}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log('Object ID:', obj.data?.objectId);
      console.log('Type:', obj.data?.type);
      console.log('Version:', obj.data?.version);

      if (obj.data?.content) {
        console.log('\nContent:');
        console.log(JSON.stringify(obj.data.content, null, 2));
      }
      console.log('');
    });

    // Provide next steps
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Copy one of the Object IDs above');
    console.log('2. Test fetching the room:');
    console.log(`   npx tsx src/test-fetch-room.ts`);
    console.log('3. Or test via API:');
    roomObjects.forEach((obj, index) => {
      const roomId = obj.data?.objectId;
      console.log(`   curl http://localhost:3001/room/${roomId}`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
  }
}

// Run the search
findRooms().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});
