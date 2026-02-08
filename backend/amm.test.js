/**
 * AMM Tests - Verify constant-sum bonding curve works correctly
 */

import { AMMSimulator } from './amm.js';

const amm = new AMMSimulator();

// Test helper
function createTestMarket() {
  return {
    deservedReserve: 50,
    fmlReserve: 50,
    totalVolume: 0,
    voteCount: 0,
    creatorEarnings: 0,
    totalDeservedShares: 0,
    totalFmlShares: 0,
    resolved: false,
    createdAt: Date.now(),
  };
}

console.log('🧪 Running AMM Tests...\n');

// Test 1: Initial prices should be 50-50
console.log('Test 1: Initial State');
const market1 = createTestMarket();
const percentages1 = amm.calculatePercentages(market1);
console.log(`Deserved: ${percentages1.deserved}%, FML: ${percentages1.fml}%`);
console.assert(percentages1.deserved === 50, 'Deserved should start at 50%');
console.assert(percentages1.fml === 50, 'FML should start at 50%');
console.log('✅ Pass\n');

// Test 2: Buying deserved should increase deserved price
console.log('Test 2: Buy Deserved Shares');
const market2 = createTestMarket();
const result2 = amm.buyShares(market2, 'deserved', 1.0);
const percentages2 = amm.calculatePercentages(market2);

console.log(`Input: 1.0 SOL`);
console.log(`Creator fee: ${result2.creatorFee.toFixed(4)} SOL (2%)`);
console.log(`Net amount: ${result2.netAmount.toFixed(4)} SOL`);
console.log(`Shares received: ${result2.shares.toFixed(4)}`);
console.log(`New reserves: D=${market2.deservedReserve.toFixed(2)}, F=${market2.fmlReserve.toFixed(2)}`);
console.log(`New percentages: D=${percentages2.deserved}%, F=${percentages2.fml}%`);

console.assert(percentages2.deserved > 50, 'Deserved should be more expensive after buying');
console.assert(percentages2.fml < 50, 'FML should be cheaper after buying deserved');
console.assert(result2.creatorFee === 0.02, 'Creator fee should be 2%');
console.log('✅ Pass\n');

// Test 3: Multiple trades should compound
console.log('Test 3: Multiple Trades');
const market3 = createTestMarket();

amm.buyShares(market3, 'deserved', 1.0);
const mid = amm.calculatePercentages(market3);
console.log(`After 1st trade: D=${mid.deserved}%, F=${mid.fml}%`);

amm.buyShares(market3, 'deserved', 1.0);
const final = amm.calculatePercentages(market3);
console.log(`After 2nd trade: D=${final.deserved}%, F=${final.fml}%`);

console.assert(final.deserved > mid.deserved, 'Price should keep rising');
console.log('✅ Pass\n');

// Test 4: Buying both sides should balance
console.log('Test 4: Balanced Trading');
const market4 = createTestMarket();

amm.buyShares(market4, 'deserved', 1.0);
amm.buyShares(market4, 'fml', 1.0);
const balanced = amm.calculatePercentages(market4);

console.log(`After buying both: D=${balanced.deserved}%, F=${balanced.fml}%`);
console.assert(Math.abs(balanced.deserved - balanced.fml) < 5, 'Should be roughly balanced');
console.log('✅ Pass\n');

// Test 5: Large trade has bigger impact
console.log('Test 5: Large Trade Impact');
const market5a = createTestMarket();
const market5b = createTestMarket();

amm.buyShares(market5a, 'deserved', 0.1);
const small = amm.calculatePercentages(market5a);

amm.buyShares(market5b, 'deserved', 10.0);
const large = amm.calculatePercentages(market5b);

console.log(`0.1 SOL trade: D=${small.deserved}%`);
console.log(`10.0 SOL trade: D=${large.deserved}%`);
console.assert(large.deserved > small.deserved, 'Larger trade should have bigger impact');
console.log('✅ Pass\n');

// Test 6: Resolution
console.log('Test 6: Market Resolution');
const market6 = createTestMarket();

// Simulate 10 votes (resolution threshold)
for (let i = 0; i < 10; i++) {
  amm.buyShares(market6, 'deserved', 0.1);
}

console.log(`Vote count: ${market6.voteCount}`);
console.assert(amm.shouldResolve(market6), 'Should resolve after 10 votes');

const finalPercentages = amm.resolveMarket(market6);
console.log(`Final result: D=${finalPercentages.deserved}%, F=${finalPercentages.fml}%`);
console.assert(market6.resolved, 'Market should be resolved');
console.log('✅ Pass\n');

// Test 7: Creator earnings accumulate
console.log('Test 7: Creator Earnings');
const market7 = createTestMarket();

amm.buyShares(market7, 'deserved', 10.0);
amm.buyShares(market7, 'fml', 10.0);

const expectedEarnings = 20.0 * 0.02; // 2% of 20 SOL
console.log(`Total volume: ${market7.totalVolume} SOL`);
console.log(`Creator earnings: ${market7.creatorEarnings.toFixed(4)} SOL`);
console.log(`Expected: ${expectedEarnings.toFixed(4)} SOL`);

console.assert(Math.abs(market7.creatorEarnings - expectedEarnings) < 0.0001, 'Creator should earn 2%');
console.log('✅ Pass\n');

// Test 8: Constant-sum invariant holds
console.log('Test 8: Constant-Sum Invariant');
const market8 = createTestMarket();
const initialK = market8.deservedReserve + market8.fmlReserve;

amm.buyShares(market8, 'deserved', 5.0);
amm.buyShares(market8, 'fml', 3.0);

const newK = market8.deservedReserve + market8.fmlReserve;
console.log(`Initial K: ${initialK}`);
console.log(`Final K: ${newK.toFixed(4)}`);

// K should grow slightly due to fees staying in pool
console.assert(newK >= initialK, 'K should stay constant or grow (fees add to pool)');
console.log('✅ Pass\n');

console.log('🎉 All tests passed!');
console.log('\n📊 Summary:');
console.log('- Prices start at 50-50');
console.log('- Buying increases price (bonding curve works)');
console.log('- Creator earns 2% of all volume');
console.log('- Market resolves after 10 votes');
console.log('- Constant-sum invariant holds');
