// API configuration for different environments
const API_URL = {
  development: '', // Empty for development (uses proxy)
  production: 'https://your-deployed-server-url.com' // Replace with your actual server URL
};

// Get the current environment
const env = import.meta.env.MODE || 'development';

// Import the contract utilities for ETH prize pool
import { getPrizePool } from './contractUtils';

// Export the base URL for API calls
export const API_BASE_URL = API_URL[env];

// MOCK DATA - Only used as fallback if API fails
const MOCK_LEADERBOARD = [
  { name: "SatoshiPlayer", score: 12500, date: "2025-03-28" },
  { name: "BlockMaster", score: 11200, date: "2025-03-27" },
  { name: "CryptoQueen", score: 10800, date: "2025-03-29" },
  { name: "TetrisWizard", score: 9500, date: "2025-03-26" },
  { name: "ChainBreaker", score: 8700, date: "2025-03-25" }
];

const MOCK_COMPETITIVE_LEADERBOARD = [
  { name: "SatoshiPlayer", walletAddress: "0x1a2b3c4d5e6f7g8h9i0j", score: 15800, date: "2025-03-28" },
  { name: "BlockMaster", walletAddress: "0x9i8h7g6f5e4d3c2b1a0", score: 14300, date: "2025-03-27" },
  { name: "CryptoQueen", walletAddress: "0x2b3c4d5e6f7g8h9i0j1a", score: 13900, date: "2025-03-26" },
  { name: "TetrisWizard", walletAddress: "0x8h9i0j1a2b3c4d5e6f7g", score: 12700, date: "2025-03-29" },
  { name: "ChainBreaker", walletAddress: "0x3c4d5e6f7g8h9i0j1a2b", score: 11500, date: "2025-03-25" }
];

const MOCK_CURRENT_SEASON = {
  seasonNumber: 3,
  startDate: "2025-03-23T00:00:00Z",
  endDate: "2025-03-31T12:00:00Z",
  potSize: 28,
  playerCount: 15,
  prizeDistribution: [
    { place: 1, percentage: 50 },
    { place: 2, percentage: 30 },
    { place: 3, percentage: 10 },
    { place: 4, percentage: 5 },
    { place: 5, percentage: 5 }
  ]
};

const MOCK_SEASON_HISTORY = [
  {
    seasonNumber: 2,
    startDate: "2025-03-16T00:00:00Z",
    endDate: "2025-03-23T00:00:00Z",
    potSize: 45,
    playerCount: 24,
    winners: [
      { walletAddress: "0xTetrisMaster", score: 14500, prize: 22.5 },
      { walletAddress: "0xMatrixGamer", score: 13200, prize: 13.5 },
      { walletAddress: "0xPixelChamp", score: 12100, prize: 4.5 },
      { walletAddress: "0xGamePro", score: 11800, prize: 2.25 },
      { walletAddress: "0xBlockKing", score: 10500, prize: 2.25 }
    ]
  },
  {
    seasonNumber: 1,
    startDate: "2025-03-09T00:00:00Z",
    endDate: "2025-03-16T00:00:00Z",
    potSize: 32,
    playerCount: 18,
    winners: [
      { walletAddress: "0xCryptoKing", score: 13800, prize: 16 },
      { walletAddress: "0xTetrisQueen", score: 12900, prize: 9.6 },
      { walletAddress: "0xBlockWizard", score: 11500, prize: 3.2 },
      { walletAddress: "0xFallingPro", score: 10200, prize: 1.6 },
      { walletAddress: "0xLineRush", score: 9800, prize: 1.6 }
    ]
  }
];

// Helper function to get the full API URL
export const getApiUrl = (endpoint = '') => {
  // In development, just use the endpoint (proxy will handle it)
  // In production, prefix with the full server URL
  return env === 'development' ? endpoint : `${API_BASE_URL}${endpoint}`;
};

/**
 * Fetch the regular leaderboard data
 * @returns {Promise<Array>} Array of leaderboard entries
 */
export const getLeaderboard = async () => {
  try {
    const response = await fetch(getApiUrl('/api/leaderboard'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Leaderboard API error:', errorText);
      throw new Error('Failed to fetch leaderboard');
    }
    
    const data = await response.json();
    
    // Add fallback for empty or malformed data
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No leaderboard data found');
      return [];
    }
    
    // Ensure data has proper types and format
    const formattedData = data.map(entry => ({
      name: String(entry.name || 'Unknown'),
      score: parseInt(entry.score || '0', 10),
      date: entry.date || new Date().toISOString().split('T')[0]
    }));
    
    // Sort by score (highest first)
    formattedData.sort((a, b) => b.score - a.score);
    
    return formattedData;
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    // Return mock data as fallback
    console.warn('Using mock leaderboard data as fallback');
    return MOCK_LEADERBOARD;
  }
};

/**
 * Fetch competitive leaderboard data
 * @returns {Promise<Array>} Array of competitive leaderboard entries
 */
export const getCompetitiveLeaderboard = async () => {
  try {
    const response = await fetch(getApiUrl('/api/competitive-leaderboard'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Competitive Leaderboard API error:', errorText);
      throw new Error('Failed to fetch competitive leaderboard');
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No competitive leaderboard data found');
      return [];
    }
    
    // Ensure data has proper types and format
    const formattedData = data.map(entry => ({
      name: String(entry.name || 'Player'),
      walletAddress: String(entry.walletAddress || entry.address || ''),
      score: parseInt(entry.score || '0', 10),
      date: entry.date || new Date().toISOString().split('T')[0]
    }));
    
    // Sort by score (highest first)
    formattedData.sort((a, b) => b.score - a.score);
    
    return formattedData;
  } catch (error) {
    console.error('Error in getCompetitiveLeaderboard:', error);
    // Return mock data as fallback
    console.warn('Using mock competitive leaderboard data as fallback');
    return MOCK_COMPETITIVE_LEADERBOARD;
  }
};

/**
 * Fetch current season data
 * @returns {Promise<Object>} Current season information
 */
export const getCurrentSeason = async () => {
  try {
    const response = await fetch(getApiUrl('/api/current-season'));
    
    if (!response.ok) {
      throw new Error('Failed to fetch current season data');
    }
    
    const data = await response.json();
    
    // Fetch prize pool from smart contract
    try {
      const prizePoolResult = await getPrizePool();
      if (prizePoolResult.success) {
        // Replace API prize pool with contract prize pool
        data.potSize = prizePoolResult.prizePool;
      }
    } catch (contractError) {
      console.error('Error fetching prize pool from contract:', contractError);
      // Keep the API value as fallback
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching current season:', error);
    // Get prize pool from contract for mock data
    let mockPotSize = MOCK_CURRENT_SEASON.potSize;
    
    try {
      const prizePoolResult = await getPrizePool();
      if (prizePoolResult.success) {
        mockPotSize = prizePoolResult.prizePool;
      }
    } catch (contractError) {
      console.error('Error fetching prize pool from contract for mock data:', contractError);
    }
    
    // Return mock data as fallback with calculated remaining time
    console.warn('Using mock season data as fallback');
    const now = new Date();
    const endDate = new Date(MOCK_CURRENT_SEASON.endDate);
    const timeRemaining = endDate - now;
    
    if (timeRemaining > 0) {
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        ...MOCK_CURRENT_SEASON,
        potSize: mockPotSize,
        timeRemaining: { days, hours, minutes }
      };
    } else {
      return {
        ...MOCK_CURRENT_SEASON,
        potSize: mockPotSize,
        timeRemaining: { days: 0, hours: 0, minutes: 0 }
      };
    }
  }
};

/**
 * Fetch season history data
 * @returns {Promise<Array>} Array of past seasons
 */
export const getSeasonHistory = async () => {
  try {
    const response = await fetch(getApiUrl('/api/season-history'));
    
    if (!response.ok) {
      throw new Error('Failed to fetch season history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching season history:', error);
    // Return mock data as fallback
    console.warn('Using mock season history data as fallback');
    return MOCK_SEASON_HISTORY;
  }
};

export default {
  getApiUrl,
  getLeaderboard,
  getCompetitiveLeaderboard,
  getCurrentSeason,
  getSeasonHistory
}; 