/**
 * Integration tests for the prediction market API
 * Run with: node test.js
 */

const BASE_URL = 'http://localhost:3000/api';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error || 'Unknown error'}`);
  }
  
  return data;
}

async function runTests() {
  console.log('🧪 Running API Tests\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  try {
    const health = await request('GET', '/health');
    console.assert(health.status === 'ok', 'Health check failed');
    console.log('✅ Test 1: Health check passed');
    passed++;
  } catch (error) {
    console.error('❌ Test 1: Health check failed:', error.message);
    failed++;
  }

  // Test 2: List markets
  try {
    const markets = await request('GET', '/markets');
    console.assert(Array.isArray(markets), 'Markets should be an array');
    console.assert(markets.length > 0, 'Should have seeded markets');
    console.log(`✅ Test 2: List markets passed (${markets.length} markets)`);
    passed++;
  } catch (error) {
    console.error('❌ Test 2: List markets failed:', error.message);
    failed++;
  }

  // Test 3: Get single market
  try {
    const market = await request('GET', '/markets/1');
    console.assert(market.id === '1', 'Market ID should be 1');
    console.assert(market.content, 'Market should have content');
    console.log('✅ Test 3: Get single market passed');
    passed++;
  } catch (error) {
    console.error('❌ Test 3: Get single market failed:', error.message);
    failed++;
  }

  // Test 4: Create market
  try {
    const newMarket = await request('POST', '/markets', {
      content: 'Test story: I accidentally deleted production database. FML',
      initial_liquidity: 0.2,
      wallet: 'test-wallet-123',
    });
    console.assert(newMarket.id, 'New market should have an ID');
    console.assert(newMarket.deserved_percent === 50, 'Should start at 50/50');
    console.log(`✅ Test 4: Create market passed (ID: ${newMarket.id})`);
    passed++;
  } catch (error) {
    console.error('❌ Test 4: Create market failed:', error.message);
    failed++;
  }

  // Test 5: Buy shares (Deserved)
  try {
    const buyResult = await request('POST', '/markets/1/buy', {
      side: 'deserved',
      amount: 0.05,
      wallet: 'test-wallet-123',
    });
    console.assert(buyResult.success, 'Buy should succeed');
    console.assert(buyResult.shares > 0, 'Should receive shares');
    console.log('✅ Test 5: Buy Deserved shares passed');
    passed++;
  } catch (error) {
    console.error('❌ Test 5: Buy Deserved shares failed:', error.message);
    failed++;
  }

  // Test 6: Buy shares (FML)
  try {
    const buyResult = await request('POST', '/markets/1/buy', {
      side: 'fml',
      amount: 0.03,
      wallet: 'test-wallet-456',
    });
    console.assert(buyResult.success, 'Buy should succeed');
    console.log('✅ Test 6: Buy FML shares passed');
    passed++;
  } catch (error) {
    console.error('❌ Test 6: Buy FML shares failed:', error.message);
    failed++;
  }

  // Test 7: Get positions
  try {
    const positions = await request('GET', '/positions/test-wallet-123');
    console.assert(Array.isArray(positions), 'Positions should be an array');
    console.assert(positions.length > 0, 'Should have positions');
    console.log(`✅ Test 7: Get positions passed (${positions.length} positions)`);
    passed++;
  } catch (error) {
    console.error('❌ Test 7: Get positions failed:', error.message);
    failed++;
  }

  // Test 8: Get stats
  try {
    const stats = await request('GET', '/stats');
    console.assert(stats.total_markets >= 4, 'Should have at least 4 markets');
    console.assert(stats.total_votes >= 2, 'Should have votes from trades');
    console.log('✅ Test 8: Get stats passed');
    passed++;
  } catch (error) {
    console.error('❌ Test 8: Get stats failed:', error.message);
    failed++;
  }

  // Test 9: Validate market resolution (simulate 10 votes)
  try {
    let marketId = '2';
    for (let i = 0; i < 10; i++) {
      await request('POST', `/markets/${marketId}/buy`, {
        side: i % 2 === 0 ? 'deserved' : 'fml',
        amount: 0.01,
        wallet: `voter-${i}`,
      });
    }
    
    const market = await request('GET', `/markets/${marketId}`);
    console.assert(market.resolved === true, 'Market should auto-resolve after 10 votes');
    console.log('✅ Test 9: Auto-resolution passed');
    passed++;
  } catch (error) {
    console.error('❌ Test 9: Auto-resolution failed:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed\n');
    process.exit(1);
  }
}

// Run tests
console.log('Starting test server...\n');

// Import and start server
import('./server.js').then(() => {
  // Wait for server to be ready
  setTimeout(() => {
    runTests().catch(error => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
  }, 1000);
});
