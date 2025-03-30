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
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching competitive leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchLeaderboard();
    
    // Update leaderboard every 30 seconds
    const intervalId = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);
  
  const toggleHistory = useCallback(() => {
    setShowHistory(!showHistory);
  }, [showHistory]);
  
  // Format wallet address to show only first and last 4 characters
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        <h2>Top Borrowers (Competitive)</h2>
      </div>
      <p className="error-message">{error}</p>
      <button className="refresh-button" onClick={fetchLeaderboard}>Try Again</button>
    </div>;
  }
  
  return (
    <div className="leaderboard-container competitive">
      <div className="leaderboard-header">
        <h2>Top Borrowers (Competitive)</h2>
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
          <SeasonInfo isDetailed={false} isVertical={true} />
          
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
                      <th>Wallet</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => {
                      const isCurrentPlayer = walletAddress && 
                        entry.walletAddress.toLowerCase() === walletAddress.toLowerCase();
                      
                      return (
                        <tr 
                          key={index} 
                          className={isCurrentPlayer ? 'current-player' : (index < 3 ? 'top-scorer' : '')}
                        >
                          <td>{index + 1}</td>
                          <td title={entry.walletAddress}>{formatAddress(entry.walletAddress)}</td>
                          <td>{entry.score.toLocaleString()}</td>
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