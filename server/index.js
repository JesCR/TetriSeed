import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5172;

// Path to leaderboard and competitive data files
const LEADERBOARD_PATH = path.join(__dirname, 'leaderboard.csv');
const COMPETITIVE_LEADERBOARD_PATH = path.join(__dirname, 'competitive_leaderboard.csv');
const SEASON_HISTORY_PATH = path.join(__dirname, 'season_history.csv');
const SEASON_CONFIG_PATH = path.join(__dirname, 'season_config.json');

// Check if the season_config.json exists, and if so, verify if it needs to be updated
const initializeSeasonConfig = () => {
  try {
    // If file exists, check if it's still current
    if (fs.existsSync(SEASON_CONFIG_PATH)) {
      const existingConfig = JSON.parse(fs.readFileSync(SEASON_CONFIG_PATH, 'utf8'));
      const now = new Date();
      const endDate = new Date(existingConfig.endDate);
      
      // If current season has ended, create a new one
      if (now > endDate) {
        const currentSeason = existingConfig.currentSeason + 1;
        
        const nextMonday = new Date();
        // Find next Monday
        while (nextMonday.getDay() !== 1) {
          nextMonday.setDate(nextMonday.getDate() + 1);
        }
        nextMonday.setHours(0, 0, 0, 0);
        
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextSunday.getDate() + 6);
        nextSunday.setHours(23, 59, 59, 999);
        
        const newSeason = {
          currentSeason,
          startDate: nextMonday.toISOString(),
          endDate: nextSunday.toISOString(),
          potSize: 0,
          playerCount: 0,
          gameCount: 0
        };
        
        fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(newSeason, null, 2));
        console.log(`Created new season ${currentSeason} starting ${nextMonday.toDateString()}`);
      }
      return;
    }
    
    // If file doesn't exist, create it
    const currentDate = new Date();
    const nextMonday = new Date();
    // Find next Monday
    while (nextMonday.getDay() !== 1) {
      nextMonday.setDate(nextMonday.getDate() + 1);
    }
    nextMonday.setHours(0, 0, 0, 0);
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);
    
    const seasonConfig = {
      currentSeason: 1,
      startDate: nextMonday.toISOString(),
      endDate: nextSunday.toISOString(),
      potSize: 0,
      playerCount: 0,
      gameCount: 0
    };
    
    fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(seasonConfig, null, 2));
    console.log(`Initialized season 1 starting ${nextMonday.toDateString()}`);
  } catch (error) {
    console.error('Error initializing season config:', error);
  }
};

// Initialize files if they don't exist
const initializeFiles = () => {
  // Regular leaderboard - just create an empty placeholder
  if (!fs.existsSync(LEADERBOARD_PATH)) {
    fs.writeFileSync(LEADERBOARD_PATH, 'name,score,date\n');
  }
  
  // Competitive leaderboard
  if (!fs.existsSync(COMPETITIVE_LEADERBOARD_PATH)) {
    fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, 'name,score,date,address\n');
  }
  
  // Season history
  if (!fs.existsSync(SEASON_HISTORY_PATH)) {
    fs.writeFileSync(SEASON_HISTORY_PATH, 'season,startDate,endDate,potSize,playerCount,gameCount,winners\n');
  }
  
  // Season config
  initializeSeasonConfig();
};

// Initialize files on server start
initializeFiles();

// Clean up duplicate entries in the competitive leaderboard file
const cleanupLeaderboard = () => {
  try {
    console.log('Running leaderboard cleanup to remove duplicate wallet addresses...');
    
    if (!fs.existsSync(COMPETITIVE_LEADERBOARD_PATH)) {
      console.log('Competitive leaderboard file does not exist, no cleanup needed');
      return;
    }
    
    const fileContent = fs.readFileSync(COMPETITIVE_LEADERBOARD_PATH, 'utf8');
    if (!fileContent.trim() || fileContent.trim() === 'name,score,date,address') {
      console.log('Competitive leaderboard is empty or only has headers, no cleanup needed');
      return;
    }
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Check if we have any records to process
    if (records.length === 0) {
      console.log('No records found in leaderboard, no cleanup needed');
      return;
    }
    
    console.log(`Processing ${records.length} leaderboard entries for duplicate wallets...`);
    
    // Map to store the best score for each wallet address
    const addressMap = new Map();
    
    // Process each record
    for (const record of records) {
      const address = record.address;
      const score = parseInt(record.score, 10);
      
      // Skip records without an address
      if (!address) continue;
      
      // Check if we've seen this address before
      if (!addressMap.has(address) || score > parseInt(addressMap.get(address).score, 10)) {
        addressMap.set(address, record);
      }
    }
    
    // Convert map back to array
    const cleanedLeaderboard = Array.from(addressMap.values());
    
    // Sort by score in descending order
    cleanedLeaderboard.sort((a, b) => parseInt(b.score, 10) - parseInt(a.score, 10));
    
    // Check if we removed any duplicates
    const duplicatesRemoved = records.length - cleanedLeaderboard.length;
    console.log(`Found ${duplicatesRemoved} duplicate wallet addresses in the leaderboard`);
    
    if (duplicatesRemoved > 0) {
      // Write the cleaned leaderboard back to the file
      const csvContent = stringify(cleanedLeaderboard, { header: true });
      fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, csvContent);
      console.log(`Leaderboard cleaned up - removed ${duplicatesRemoved} duplicate wallet entries`);
    } else {
      console.log('No duplicate wallet addresses found, leaderboard is clean');
    }
  } catch (error) {
    console.error('Error cleaning up leaderboard:', error);
  }
};

// Clean up any duplicate wallet addresses in the leaderboard
cleanupLeaderboard();

// Updated getLeaderboard function to support both regular and competitive mode
const getLeaderboard = (isCompetitive = false) => {
  try {
    const filePath = isCompetitive ? COMPETITIVE_LEADERBOARD_PATH : LEADERBOARD_PATH;
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    if (!fileContent.trim()) {
      return [];
    }
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Convert score to number for sorting
    const parsedRecords = records.map(record => ({
      ...record,
      score: parseInt(record.score, 10)
    }));
    
    let leaderboard = parsedRecords;
    
    if (isCompetitive) {
      // For competitive mode, deduplicate by wallet address (keeping best score)
      const addressMap = new Map();
      
      for (const record of parsedRecords) {
        const address = record.address;
        if (!addressMap.has(address) || record.score > addressMap.get(address).score) {
          addressMap.set(address, record);
        }
      }
      
      // Convert map back to array
      leaderboard = Array.from(addressMap.values());
    }
    
    // Sort by score in descending order
    leaderboard.sort((a, b) => b.score - a.score);
    
    return leaderboard;
  } catch (error) {
    console.error(`Error getting ${isCompetitive ? 'competitive' : 'regular'} leaderboard:`, error);
    return [];
  }
};

// Get current season data
const getCurrentSeason = () => {
  try {
    if (!fs.existsSync(SEASON_CONFIG_PATH)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(SEASON_CONFIG_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error getting current season:', error);
    return null;
  }
};

// Get season history
const getSeasonHistory = () => {
  try {
    console.log('Reading season history from:', SEASON_HISTORY_PATH);
    
    if (!fs.existsSync(SEASON_HISTORY_PATH)) {
      console.log('Season history file does not exist');
      return [];
    }
    
    const fileContent = fs.readFileSync(SEASON_HISTORY_PATH, 'utf8');
    console.log('Season history file content:', fileContent);
    
    if (!fileContent.trim() || fileContent.trim() === 'season,startDate,endDate,potSize,playerCount,gameCount,winners') {
      console.log('Season history file is empty or only has headers');
      
      // Return hardcoded data for demonstration purposes
      return [
        {
          season: 1,
          startDate: '2025-03-09T12:00:00.000Z',
          endDate: '2025-03-16T12:00:00.000Z',
          potSize: 32,
          winners: [
            { name: 'CryptoKing', address: '0xabcdef1234567890abcdef1234567890abcdef12', rank: 1, prize: 16, percentage: 50 },
            { name: 'TetrisQueen', address: '0xbcdef1234567890abcdef1234567890abcdef123', rank: 2, prize: 9.6, percentage: 30 },
            { name: 'BlockWizard', address: '0xcdef1234567890abcdef1234567890abcdef1234', rank: 3, prize: 3.2, percentage: 10 },
            { name: 'FallingPro', address: '0xdef1234567890abcdef1234567890abcdef12345', rank: 4, prize: 1.6, percentage: 5 },
            { name: 'LineRush', address: '0xef1234567890abcdef1234567890abcdef123456', rank: 5, prize: 1.6, percentage: 5 }
          ]
        },
        {
          season: 2,
          startDate: '2025-03-16T12:00:00.000Z',
          endDate: '2025-03-23T12:00:00.000Z',
          potSize: 45,
          winners: [
            { name: 'TetrisMaster', address: '0x9876543210fedcba9876543210fedcba98765432', rank: 1, prize: 22.5, percentage: 50 },
            { name: 'MatrixGamer', address: '0x8765432109fedcba9876543210fedcba9876543', rank: 2, prize: 13.5, percentage: 30 },
            { name: 'PixelChamp', address: '0x765432109fedcba9876543210fedcba98765432', rank: 3, prize: 4.5, percentage: 10 },
            { name: 'GamePro', address: '0x65432109fedcba9876543210fedcba987654321', rank: 4, prize: 2.25, percentage: 5 },
            { name: 'BlockKing', address: '0x5432109fedcba9876543210fedcba9876543210', rank: 5, prize: 2.25, percentage: 5 }
          ]
        }
      ];
    }
    
    try {
      const parsed = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      console.log('Parsed season history:', parsed);
      
      // Process each season to parse the winners JSON string
      const processedHistory = parsed.map(season => {
        try {
          // Convert season to number
          season.season = parseInt(season.season, 10);
          
          // Convert potSize to number
          season.potSize = parseInt(season.potSize, 10) || 0;
          
          // Parse winners JSON string if it exists
          if (season.winners && typeof season.winners === 'string') {
            try {
              season.winners = JSON.parse(season.winners);
            } catch (e) {
              console.error('Error parsing winners JSON:', e);
              season.winners = [];
            }
          } else {
            season.winners = [];
          }
        } catch (e) {
          console.error('Error processing season:', e);
        }
        return season;
      });
      
      console.log('Processed season history:', processedHistory);
      
      return processedHistory;
    } catch (error) {
      console.error('Error parsing CSV, falling back to hardcoded data:', error);
      
      // Return hardcoded data as fallback
      return [
        {
          season: 1,
          startDate: '2025-03-09T12:00:00.000Z',
          endDate: '2025-03-16T12:00:00.000Z',
          potSize: 32,
          winners: [
            { name: 'CryptoKing', address: '0xabcdef1234567890abcdef1234567890abcdef12', rank: 1, prize: 16, percentage: 50 },
            { name: 'TetrisQueen', address: '0xbcdef1234567890abcdef1234567890abcdef123', rank: 2, prize: 9.6, percentage: 30 },
            { name: 'BlockWizard', address: '0xcdef1234567890abcdef1234567890abcdef1234', rank: 3, prize: 3.2, percentage: 10 },
            { name: 'FallingPro', address: '0xdef1234567890abcdef1234567890abcdef12345', rank: 4, prize: 1.6, percentage: 5 },
            { name: 'LineRush', address: '0xef1234567890abcdef1234567890abcdef123456', rank: 5, prize: 1.6, percentage: 5 }
          ]
        },
        {
          season: 2,
          startDate: '2025-03-16T12:00:00.000Z',
          endDate: '2025-03-23T12:00:00.000Z',
          potSize: 45,
          winners: [
            { name: 'TetrisMaster', address: '0x9876543210fedcba9876543210fedcba98765432', rank: 1, prize: 22.5, percentage: 50 },
            { name: 'MatrixGamer', address: '0x8765432109fedcba9876543210fedcba9876543', rank: 2, prize: 13.5, percentage: 30 },
            { name: 'PixelChamp', address: '0x765432109fedcba9876543210fedcba98765432', rank: 3, prize: 4.5, percentage: 10 },
            { name: 'GamePro', address: '0x65432109fedcba9876543210fedcba987654321', rank: 4, prize: 2.25, percentage: 5 },
            { name: 'BlockKing', address: '0x5432109fedcba9876543210fedcba9876543210', rank: 5, prize: 2.25, percentage: 5 }
          ]
        }
      ];
    }
  } catch (error) {
    console.error('Error getting season history:', error);
    return [];
  }
};

// Add score to competitive leaderboard
const addCompetitiveScore = (name, score, address) => {
  try {
    if (!name || score === undefined || !address) {
      return { success: false, message: 'Name, score, and address are required' };
    }
    
    // Parse score as integer
    const parsedScore = parseInt(score, 10);
    
    // Get existing leaderboard
    const leaderboard = getLeaderboard(true);
    
    // Check if the address already exists in the leaderboard
    const existingEntryIndex = leaderboard.findIndex(entry => entry.address === address);
    
    // Track if we're adding a new entry or updating an existing one
    let action = 'added';
    let isUpdate = false;
    
    if (existingEntryIndex !== -1) {
      // Address already exists
      const existingEntry = leaderboard[existingEntryIndex];
      
      // Only update if the new score is higher
      if (parsedScore > parseInt(existingEntry.score, 10)) {
        // Create an updated entry
        const updatedEntry = {
          name: String(name),
          score: parsedScore,
          date: new Date().toISOString().split('T')[0],
          address: address
        };
        
        // Remove old entry and add updated one
        leaderboard.splice(existingEntryIndex, 1);
        leaderboard.push(updatedEntry);
        action = 'updated';
        isUpdate = true;
      } else {
        // New score is not better, don't update the leaderboard entry
        console.log(`Score ${parsedScore} not better than existing ${existingEntry.score} for address ${address}`);
        
        // Update season statistics (counts for games played, etc.)
        updateSeasonStatistics(address);
        
        return { 
          success: true, 
          message: 'Score not high enough to update leaderboard',
          rank: null,
          higherScoreExists: true,
          currentBest: existingEntry.score
        };
      }
    } else {
      // New wallet address, add to leaderboard
      const newEntry = {
        name: String(name),
        score: parsedScore,
        date: new Date().toISOString().split('T')[0],
        address: address
      };
      
      leaderboard.push(newEntry);
    }
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Write updated leaderboard back to file
    const csvContent = stringify(leaderboard, { header: true });
    fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, csvContent);
    
    // Update season statistics (counts for games played, etc.)
    updateSeasonStatistics(address);
    
    // Calculate rank for the response
    const rank = leaderboard.findIndex(entry => 
      entry.address === address
    ) + 1;
    
    return { 
      success: true, 
      message: `Score ${action} to competitive leaderboard`,
      rank: rank,
      isUpdate: isUpdate
    };
  } catch (error) {
    console.error('Error adding competitive score:', error);
    return { success: false, message: 'Server error' };
  }
};

// Update season statistics without modifying leaderboard
const updateSeasonStatistics = (address) => {
  try {
    // Get current season
    const season = getCurrentSeason();
    if (!season) return;
    
    // Update game count (but not player count since this is an existing player)
    season.gameCount = (season.gameCount || 0) + 1;
    
    // Write updated season config to file
    fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(season, null, 2));
    
    console.log(`Season statistics updated: Game played by ${address}`);
  } catch (error) {
    console.error('Error updating season statistics:', error);
  }
};

// Check for season updates on server start and every hour
const checkAndUpdateSeason = () => {
  try {
    const season = getCurrentSeason();
    if (!season) return;
    
    const now = new Date();
    const endDate = new Date(season.endDate);
    
    // If current season has ended
    if (now > endDate) {
      // Get top 5 players from competitive leaderboard
      const leaderboard = getLeaderboard(true);
      const top5 = leaderboard.slice(0, 5);
      
      // Calculate prize distribution
      const prizes = calculatePrizes(top5, season.potSize);
      
      // Add season to history
      const seasonHistoryEntry = {
        season: season.currentSeason,
        startDate: season.startDate,
        endDate: season.endDate,
        potSize: season.potSize,
        playerCount: season.playerCount || 0,
        gameCount: season.gameCount || 0,
        winners: JSON.stringify(prizes)
      };
      
      const history = getSeasonHistory();
      history.push(seasonHistoryEntry);
      
      const csvContent = stringify(history, { header: true });
      fs.writeFileSync(SEASON_HISTORY_PATH, csvContent);
      
      // Start a new season
      const nextMonday = new Date();
      while (nextMonday.getDay() !== 1) {
        nextMonday.setDate(nextMonday.getDate() + 1);
      }
      nextMonday.setHours(0, 0, 0, 0);
      
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextSunday.getDate() + 6);
      nextSunday.setHours(23, 59, 59, 999);
      
      const newSeason = {
        currentSeason: season.currentSeason + 1,
        startDate: nextMonday.toISOString(),
        endDate: nextSunday.toISOString(),
        potSize: 0,
        playerCount: 0,
        gameCount: 0
      };
      
      fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(newSeason, null, 2));
      
      // Clear competitive leaderboard for new season
      fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, 'name,score,date,address\n');
      
      return true; // Season was updated
    }
    
    return false; // No season update needed
  } catch (error) {
    console.error('Error checking/updating season:', error);
    return false;
  }
};

// Calculate prize distribution for top 5 players
const calculatePrizes = (top5, potSize) => {
  const percentages = [0.5, 0.3, 0.1, 0.05, 0.05]; // 50%, 30%, 10%, 5%, 5%
  
  // Ensure each wallet only appears once (take highest score)
  const uniqueWallets = [];
  const seen = new Set();
  
  for (const player of top5) {
    if (!seen.has(player.address)) {
      seen.add(player.address);
      uniqueWallets.push(player);
    }
  }
  
  // Calculate prizes only for unique wallets
  return uniqueWallets.map((player, index) => {
    const percentage = percentages[index] || 0;
    const prize = Math.floor(potSize * percentage * 100) / 100; // Round to 2 decimals
    
    return {
      name: player.name,
      address: player.address,
      rank: index + 1,
      prize: prize,
      percentage: percentage * 100
    };
  });
};

// Check for season updates on server start and every hour
checkAndUpdateSeason();
setInterval(checkAndUpdateSeason, 60 * 60 * 1000);

// Use middleware
app.use(cors());
app.use(express.json());

// Add these endpoints to handle competitive mode
// Get competitive leaderboard
app.get('/api/competitive-leaderboard', (req, res) => {
  // Check for season updates
  checkAndUpdateSeason();
  
  const leaderboard = getLeaderboard(true);
  res.json(leaderboard.slice(0, 5)); // Return top 5
});

// Submit competitive score
app.post('/api/competitive-score', (req, res) => {
  const { name, score, address } = req.body;
  
  if (!name || score === undefined || !address) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name, score, and address are required' 
    });
  }
  
  // Process the score submission
  const result = addCompetitiveScore(name, score, address);
  
  if (result.success) {
    res.json({
      success: true,
      rank: result.rank,
      message: 'Score submitted successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.message
    });
  }
});

// Get current season data
app.get('/api/current-season', (req, res) => {
  // Check for season updates
  checkAndUpdateSeason();
  
  const season = getCurrentSeason();
  if (!season) {
    return res.status(404).json({ error: 'Season data not found' });
  }
  
  // Calculate time remaining
  const now = new Date();
  
  // For testing, we'll use a fixed date to ensure our mock data works
  // const now = new Date("2023-05-07T12:00:00.000Z"); // One day before end date
  
  const endDate = new Date(season.endDate);
  const timeRemaining = Math.max(0, endDate - now);
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  // Convert dates to ISO string for consistent format
  const responseData = {
    ...season,
    timeRemaining: {
      days,
      hours,
      minutes,
      total: timeRemaining
    }
  };
  
  console.log('Sending season data:', responseData);
  res.json(responseData);
});

// Get season history
app.get('/api/season-history', (req, res) => {
  const history = getSeasonHistory();
  res.json(history);
});

// Get regular leaderboard - return empty array with message
app.get('/api/leaderboard', (req, res) => {
  console.log('Received regular leaderboard request - only tracking competitive scores');
  res.json({
    scores: [],
    message: 'Only competitive scores are tracked'
  });
});

// Add score to regular leaderboard - just return success without saving
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  console.log('Received regular score submission:', { name, score });
  console.log('Not saving - only competitive scores are tracked');
  
  // Return successful response but don't actually save anything
  res.json({ 
    success: true,
    message: 'Only competitive scores are tracked',
    rank: null
  });
});

// Process competitive payment
app.post('/api/payment', (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ 
      success: false, 
      message: 'Wallet address is required' 
    });
  }
  
  try {
    // Get current season
    const season = getCurrentSeason();
    if (!season) {
      return res.status(404).json({ 
        success: false, 
        message: 'Season data not found' 
      });
    }
    
    // Check if this is a new player for this season
    const leaderboard = getLeaderboard(true);
    const isNewPlayer = !leaderboard.some(entry => entry.address === address);
    
    // Update pot size
    season.potSize += 1; // Add 1 $SUPR to pot
    
    // Only increment player count if this is a new player
    if (isNewPlayer) {
      season.playerCount = (season.playerCount || 0) + 1;
    }
    
    // Initialize or update game count
    season.gameCount = (season.gameCount || 0) + 1;
    
    // Write updated season config to file
    fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(season, null, 2));
    
    console.log(`Payment processed: 1 $SUPR added to pot from ${address}. New pot size: ${season.potSize}, player count: ${season.playerCount}, game count: ${season.gameCount}`);
    
    return res.json({ 
      success: true, 
      message: 'Payment processed successfully', 
      potSize: season.potSize,
      playerCount: season.playerCount,
      gameCount: season.gameCount,
      isNewPlayer: isNewPlayer,
      txHash: `mock_tx_${Date.now()}` 
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error processing payment' 
    });
  }
});

// Listen on PORT, but try alternative ports if busy
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT); 