/**
 * Test Script: Fetch Room Data from Blockchain
 *
 * Usage:
 * 1. Update ROOM_ID with your actual room ID
 * 2. Run: npx tsx src/test-fetch-room.ts
 */

import { suiClient } from './sui/client.js';
import { config } from './config/index.js';
import { relayerService } from './services/relayer.service.js';

// ⚠️ GANTI INI DENGAN ROOM ID ANDA
const ROOM_ID = '0x10ebd4f9b0b491d563a7691a7ce08d3c96a200f4a08588f19a18350eb5dbbf14';

async function testFetchRoom() {
  console.log('🧪 Starting Room Fetch Test...\n');

  // Test 1: Check RPC Connection
  console.log('1️⃣ Testing RPC Connection...');
  try {
    const chainId = await suiClient.getChainIdentifier();
    console.log('✅ RPC Connected!', { chainId, network: config.network });
  } catch (error: any) {
    console.error('❌ RPC Connection Failed:', error.message);
    return;
  }

  // Test 2: Check if Room ID is valid
  console.log('\n2️⃣ Checking Room ID...');
  if (!ROOM_ID || !ROOM_ID.startsWith('0x') || ROOM_ID.length < 10) {
    console.error('❌ Invalid Room ID format!');
    console.log('💡 Room ID should start with 0x and be a valid Sui object ID');
    return;
  }
  console.log('✅ Room ID:', ROOM_ID);

  // Test 3: Fetch Room Data using Raw Sui Client
  console.log('\n3️⃣ Fetching Room Data (Raw Sui Client)...');
  try {
    const roomObject = await suiClient.getObject({
      id: ROOM_ID,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });

    if (!roomObject.data) {
      console.error('❌ Room not found on blockchain!');
      console.log('💡 Make sure the room has been created and the ID is correct');
      return;
    }

    console.log('✅ Room Data Found!');
    console.log('\n📦 Room Object Details:');
    console.log('  - Object ID:', roomObject.data.objectId);
    console.log('  - Version:', roomObject.data.version);
    console.log('  - Type:', roomObject.data.type);
    console.log('  - Owner:', roomObject.data.owner);

    if (roomObject.data.content) {
      console.log('\n📄 Room Content:');
      console.log(JSON.stringify(roomObject.data.content, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch room:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return;
  }

  // Test 4: Fetch Room Data using Relayer Service
  console.log('\n4️⃣ Fetching Room Data (Relayer Service)...');
  try {
    const roomData = await relayerService.getRoomData(ROOM_ID);
    console.log('✅ Room Data fetched via Relayer Service!');
    console.log('\n📄 Room Data:');
    console.log(JSON.stringify(roomData, null, 2));
  } catch (error: any) {
    console.error('❌ Relayer Service Error:', error.message);
  }

  console.log('\n✨ Test Complete!\n');
}

// Run the test
testFetchRoom().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});
