import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import SeasonInfo from './SeasonInfo';
import SeasonHistory from './SeasonHistory';

const CompetitiveLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/competitive-leaderboard`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch competitive leaderboard');
        }
        
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching competitive leaderboard:', error);
        setError('Could not load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
    
    // Refresh leaderboard every 60 seconds
    const intervalId = setInterval(fetchLeaderboard, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };
  
  // Format wallet address to short form (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
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
          <SeasonInfo isDetailed={false} />
          
          {loading ? (
            <p className="loading-text">Loading leaderboard...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : leaderboard.length === 0 ? (
            <p className="empty-text">No competitive scores yet. Be the first!</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>R</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Wallet</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className={index === 0 ? 'top-scorer' : ''}>
                    <td>{index + 1}</td>
                    <td>{entry.name}</td>
                    <td>{entry.score}</td>
                    <td title={entry.address}>{formatAddress(entry.address)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default CompetitiveLeaderboard; 