import { useState, useEffect, useCallback, memo } from 'react';
import { getCompetitiveLeaderboard } from '../utils/apiConfig';
import SeasonInfo from './SeasonInfo';
import SeasonHistory from './SeasonHistory';

const CompetitiveLeaderboard = ({ walletAddress = '0x9i8h7g6f5e4d3c2b1a0' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCompetitiveLeaderboard();
      console.log('Leaderboard data received:', data);
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching competitive leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Expose the fetchLeaderboard function globally
  useEffect(() => {
    window.refreshCompetitiveLeaderboard = fetchLeaderboard;
    
    return () => {
      // Clean up when component unmounts
      delete window.refreshCompetitiveLeaderboard;
    };
  }, [fetchLeaderboard]);
  
  useEffect(() => {
    fetchLeaderboard();
    
    // Update leaderboard every 30 seconds
    const intervalId = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);
  
  const toggleHistory = useCallback(() => {
    setShowHistory(!showHistory);
  }, [showHistory]);
  
  // Format player name with wallet address
  const formatPlayerInfo = useCallback((entry) => {
    
    if (!entry) return 'Unknown';
    
    // Check different possible property names for player name and address
    const name = entry.name || entry.playerName || '';
    const address = entry.walletAddress || entry.address || '';
    
    // Get first 5 characters of wallet address
    const shortWallet = address ? address.slice(0, 5) : '';
    
    // Combine player name and wallet address
    if (name) {
      return `${name} (${shortWallet})`;
    } else if (shortWallet) {
      return shortWallet;
    } else {
      return 'Unknown Player';
    }
  }, []);
  
  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }, []);
  
  if (error) {
    return <div className="leaderboard-container competitive">
      <div className="leaderboard-header">
        <h2>Top Borrowers</h2>
      </div>
      <p className="error-message">{error}</p>
      <button className="refresh-button" onClick={fetchLeaderboard}>Try Again</button>
    </div>;
  }
  
  return (
    <div className="leaderboard-container competitive">
      <div className="leaderboard-header">
        <h2>Top Borrowers</h2>
        <button 
          className="history-button" 
          onClick={toggleHistory}
          title={showHistory ? "Hide Season History" : "Show Season History"}
        >
          {showHistory ? "🏆" : "📜"}
        </button>
      </div>
      
      {showHistory ? (
        <SeasonHistory />
      ) : (
        <>        
          {loading ? (
            <p className="loading-text">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="empty-text">No competitive scores yet. Be the first!</p>
          ) : (
            <>
              <div className="leaderboard-scrollable">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => {
                      // Check for different possible property names for address
                      const entryAddress = entry.walletAddress || entry.address || '';
                      const isCurrentPlayer = walletAddress && 
                        entryAddress && entryAddress.toLowerCase() === walletAddress.toLowerCase();
                      
                      return (
                        <tr 
                          key={index} 
                          className={isCurrentPlayer ? 'current-player' : (index < 3 ? 'top-scorer' : '')}
                        >
                          <td>{index + 1}</td>
                          <td title={entryAddress}>{formatPlayerInfo(entry)}</td>
                          <td><span className="crypto-amount">{entry.score ? entry.score.toLocaleString() : '0'}</span></td>
                          <td>{formatDate(entry.date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="leaderboard-footer">
                <p className="small-text">Connect wallet to participate in competitive mode</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default memo(CompetitiveLeaderboard); 