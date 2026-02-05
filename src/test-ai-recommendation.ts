import { aiService } from './services/ai.service.js';

/**
 * Test AI Recommendation Service with Real DeFi Protocols
 */
async function testAIRecommendations() {
  console.log('='.repeat(60));
  console.log('Testing AI Recommendation Service');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'Valid Conservative Prompt (Indonesian)',
      prompt: 'Saya ingin investasi yang aman dan stabil untuk dana darurat',
      expectStrategy: 1,
    },
    {
      name: 'Valid Balanced Prompt (Indonesian)',
      prompt: 'Saya mau investasi seimbang antara aman dan pertumbuhan untuk tabungan kuliah',
      expectStrategy: 2,
    },
    {
      name: 'Valid Aggressive Prompt (Indonesian)',
      prompt: 'Saya ingin hasil maksimal dan berani ambil risiko tinggi untuk target profit besar',
      expectStrategy: 3,
    },
    {
      name: 'Valid Conservative Prompt (English)',
      prompt: 'I want a safe and stable investment with low risk for my emergency fund',
      expectStrategy: 1,
    },
    {
      name: 'Valid Aggressive Prompt (English)',
      prompt: 'I want maximum growth and high returns, willing to take aggressive risk',
      expectStrategy: 3,
    },
    {
      name: 'Invalid Prompt - Too Short',
      prompt: 'abc',
      expectError: true,
    },
    {
      name: 'Invalid Prompt - Gibberish',
      prompt: 'asdfghjklqwerty',
      expectError: true,
    },
    {
      name: 'Invalid Prompt - Random Characters',
      prompt: '123456789',
      expectError: true,
    },
    {
      name: 'Invalid Prompt - Unrelated Topic',
      prompt: 'hello how are you today',
      expectError: true,
    },
  ];

  for (const testCase of testCases) {
    console.log('\n' + '-'.repeat(60));
    console.log(`Test: ${testCase.name}`);
    console.log(`Prompt: "${testCase.prompt}"`);
    console.log('-'.repeat(60));

    try {
      const result = await aiService.getRecommendations({ text: testCase.prompt });

      if (testCase.expectError) {
        console.log('❌ FAIL: Expected error but got success');
        console.log('Result:', JSON.stringify(result, null, 2));
      } else {
        const recommended = result.strategies.find((s) => s.recommended);

        console.log('✅ SUCCESS');
        console.log(`Recommended Strategy: ${recommended?.name} (ID: ${recommended?.id})`);
        console.log(`Risk Level: ${recommended?.riskLevel}`);
        console.log(`Expected APY: ${recommended?.expectedReturn}%`);
        console.log(`\nProtocols:`);
        recommended?.protocols?.forEach((p) => {
          console.log(`  - ${p.name} (${p.type}): ${p.apy}`);
        });
        console.log(`\nAllocation:`);
        if (recommended?.allocation) {
          Object.entries(recommended.allocation).forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}%`);
          });
        }
        console.log(`\nSuggested Tokens: ${recommended?.suggestedTokens?.join(', ')}`);
        console.log(`\nReasoning: ${recommended?.reasoning}`);

        if (testCase.expectStrategy && recommended?.id !== testCase.expectStrategy) {
          console.log(`⚠️  WARNING: Expected strategy ${testCase.expectStrategy} but got ${recommended?.id}`);
        }
      }
    } catch (error: any) {
      if (testCase.expectError) {
        console.log('✅ SUCCESS: Error caught as expected');
        console.log(`Error: ${error.message}`);
      } else {
        console.log('❌ FAIL: Unexpected error');
        console.log(`Error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('All Tests Completed');
  console.log('='.repeat(60));
}

// Run tests
testAIRecommendations().catch(console.error);
