import { useState, useEffect, useCallback, memo } from 'react';
import { getLeaderboard } from '../utils/apiConfig';

const Leaderboard = ({ currentPlayer = 'BlockMaster' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    
    // Update leaderboard every 30 seconds (increased from 3 seconds)
    const intervalId = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }, []);

  if (error) {
    return <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>Top Borrowers</h2>
      </div>
      <p className="error-message">{error}</p>
      <button className="refresh-button" onClick={fetchLeaderboard}>Try Again</button>
    </div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>Top Borrowers</h2>
        <button 
          className="refresh-button" 
          onClick={fetchLeaderboard}
          aria-label="Refresh leaderboard"
        >
          ↻
        </button>
      </div>
      
      {isLoading ? (
        <p className="loading-text">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="empty-text">No loans approved yet. Be the first!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => {
              const isCurrentPlayer = currentPlayer && 
                entry.name.toLowerCase() === currentPlayer.toLowerCase();
              
              return (
                <tr 
                  key={index} 
                  className={isCurrentPlayer ? 'current-player' : (index < 3 ? 'top-scorer' : '')}
                >
                  <td>{index + 1}</td>
                  <td>{entry.name}</td>
                  <td><span className="crypto-amount">{entry.score.toLocaleString()}</span></td>
                  <td>{formatDate(entry.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default memo(Leaderboard); 