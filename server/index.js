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
          playerCount: 0
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
      playerCount: 0
    };
    
    fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(seasonConfig, null, 2));
    console.log(`Initialized season 1 starting ${nextMonday.toDateString()}`);
  } catch (error) {
    console.error('Error initializing season config:', error);
  }
};

// Initialize files if they don't exist
const initializeFiles = () => {
  // Regular leaderboard
  if (!fs.existsSync(LEADERBOARD_PATH)) {
    fs.writeFileSync(LEADERBOARD_PATH, 'name,score,date\n');
  }
  
  // Competitive leaderboard
  if (!fs.existsSync(COMPETITIVE_LEADERBOARD_PATH)) {
    fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, 'name,score,date,address\n');
  }
  
  // Season history
  if (!fs.existsSync(SEASON_HISTORY_PATH)) {
    fs.writeFileSync(SEASON_HISTORY_PATH, 'season,startDate,endDate,potSize,winners\n');
  }
  
  // Season config
  initializeSeasonConfig();
};

// Initialize files on server start
initializeFiles();

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
    const leaderboard = records.map(record => ({
      ...record,
      score: parseInt(record.score, 10)
    }));
    
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
    
    if (!fileContent.trim() || fileContent.trim() === 'season,startDate,endDate,potSize,winners') {
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
          if (season.winners && typeof season.winners === 'string') {
            season.winners = JSON.parse(season.winners);
          }
        } catch (e) {
          console.error('Error parsing winners JSON:', e);
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

// Add score to competitive leaderboard and update pot
const addCompetitiveScore = (name, score, address) => {
  try {
    if (!name || !score || !address) {
      return { success: false, message: 'Missing required data' };
    }
    
    // Validate score
    const scoreValue = parseInt(score, 10);
    if (isNaN(scoreValue) || scoreValue <= 0) {
      return { success: false, message: 'Invalid score' };
    }
    
    // Get current competitive leaderboard
    const leaderboard = getLeaderboard(true);
    
    // Add new entry
    const newEntry = {
      name,
      score: scoreValue,
      date: new Date().toISOString().split('T')[0],
      address
    };
    
    // Add entry to leaderboard
    leaderboard.push(newEntry);
    
    // Sort leaderboard by score
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Write updated leaderboard back to file
    const csvContent = stringify(leaderboard, { header: true });
    fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, csvContent);
    
    // Update season pot
    const season = getCurrentSeason();
    if (season) {
      season.potSize += 1; // Add 1 $SUPR to pot
      season.playerCount += 1;
      fs.writeFileSync(SEASON_CONFIG_PATH, JSON.stringify(season, null, 2));
    }
    
    return { success: true, message: 'Score added to competitive leaderboard' };
  } catch (error) {
    console.error('Error adding competitive score:', error);
    return { success: false, message: 'Server error' };
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
        playerCount: 0
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
  
  return top5.map((player, index) => {
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
  const result = addCompetitiveScore(name, score, address);
  res.json(result);
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

// Get regular leaderboard
app.get('/api/leaderboard', (req, res) => {
  console.log('Received leaderboard request');
  
  const leaderboard = getLeaderboard(false);
  console.log(`Read ${leaderboard.length} entries from leaderboard`);
  
  // Send top 5
  const topScores = leaderboard.slice(0, 5);
  console.log('Sending top 5:', topScores);
  res.json(topScores);
});

// Add score to regular leaderboard
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  console.log('Received score submission:', { name, score });
  
  if (!name || score === undefined) {
    return res.status(400).json({ error: 'Name and score are required' });
  }
  
  // Ensure score is a number
  const scoreNum = parseInt(score, 10);
  if (isNaN(scoreNum) || scoreNum < 0) {
    return res.status(400).json({ error: 'Score must be a valid positive number' });
  }
  
  const newEntry = {
    name: String(name),
    score: scoreNum,
    date: new Date().toISOString().split('T')[0]
  };
  
  console.log('Created new entry:', newEntry);
  
  // Get existing leaderboard
  const leaderboard = getLeaderboard(false);
  
  // Add new entry
  leaderboard.push(newEntry);
  
  // Sort by score (highest first)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Write back to CSV
  try {
    const csvContent = stringify(leaderboard, { header: true });
    fs.writeFileSync(LEADERBOARD_PATH, csvContent);
    
    // Check if the new entry is in the top 5
    const rank = leaderboard.findIndex(entry => 
      entry.name === newEntry.name && 
      entry.score === newEntry.score &&
      entry.date === newEntry.date
    ) + 1;
    
    const isTop5 = rank <= 5;
    
    console.log('Entry saved, rank:', rank, 'isTop5:', isTop5);
    
    res.json({ 
      success: true, 
      isTop5,
      rank
    });
  } catch (error) {
    console.error('Error writing to leaderboard:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
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