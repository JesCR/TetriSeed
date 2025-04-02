import fetch from 'node-fetch';

// Test data with the same wallet address but different scores
const testCases = [
  { name: 'Player1', score: 100, address: '0xtest123456789' },
  { name: 'Player1', score: 200, address: '0xtest123456789' }, // Higher score, should replace previous entry
  { name: 'Player1', score: 150, address: '0xtest123456789' }, // Lower than 200, should be rejected
  { name: 'Player1', score: 300, address: '0xtest123456789' }, // Highest score, should be the one kept
];

const submitScore = async (entry) => {
  try {
    console.log(`Submitting score: ${entry.name} - ${entry.score} - ${entry.address}`);
    
    const response = await fetch('http://localhost:5172/api/competitive-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    
    const result = await response.json();
    console.log('Response:', result);
    return result;
  } catch (error) {
    console.error('Error submitting score:', error);
    return { success: false, error: error.message };
  }
};

const checkLeaderboard = async () => {
  try {
    console.log('\nFetching leaderboard to verify results...');
    
    const response = await fetch('http://localhost:5172/api/competitive-leaderboard');
    const leaderboard = await response.json();
    
    console.log('Current leaderboard:', leaderboard);
    
    // Check if our test wallet address only appears once
    const testEntries = leaderboard.filter(entry => entry.address === '0xtest123456789');
    console.log(`\nFound ${testEntries.length} entries with test wallet address`);
    
    if (testEntries.length === 1) {
      console.log('SUCCESS: Only one entry per wallet address is maintained!');
      console.log(`Score value for test address: ${testEntries[0].score}`);
      
      if (parseInt(testEntries[0].score) === 300) {
        console.log('SUCCESS: The highest score was kept as expected!');
      } else {
        console.log(`FAILURE: Expected score 300, but got ${testEntries[0].score}`);
      }
    } else if (testEntries.length === 0) {
      console.log('FAILURE: Test wallet address not found in leaderboard');
    } else {
      console.log('FAILURE: Multiple entries found for the same wallet address');
      testEntries.forEach(entry => {
        console.log(`- ${entry.name}: ${entry.score}`);
      });
    }
  } catch (error) {
    console.error('Error checking leaderboard:', error);
  }
};

const runTest = async () => {
  console.log('Testing duplicate wallet address handling...\n');
  
  // Submit each test case in sequence
  for (const testCase of testCases) {
    const result = await submitScore(testCase);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Check the final leaderboard
  await checkLeaderboard();
  
  console.log('\nTest completed!');
};

// Run the test
runTest(); 