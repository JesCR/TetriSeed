import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simpler implementation for the fetchLeaderboard function
  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching leaderboard data...');
      
      const response = await fetch(getApiUrl('/api/leaderboard'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Leaderboard API error:', errorText);
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      console.log('Raw leaderboard data:', data);
      
      // Add fallback for empty or malformed data
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No leaderboard data found');
        setScores([]);
      } else {
        // Ensure data has proper types and format
        const formattedData = data.map(entry => ({
          name: String(entry.name || 'Unknown'),
          score: parseInt(entry.score || '0', 10),
          date: entry.date || new Date().toISOString().split('T')[0]
        }));
        
        console.log('Formatted leaderboard data:', formattedData);
        
        // Sort by score (highest first)
        formattedData.sort((a, b) => b.score - a.score);
        
        setScores(formattedData);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
      setScores([]); // Clear scores on error
    } finally {
      setIsLoading(false);
    }
  };

  // Load leaderboard on mount and set up regular refresh
  useEffect(() => {
    fetchLeaderboard();
    
    // Poll for updates every 3 seconds
    const intervalId = setInterval(fetchLeaderboard, 3000);
    
    // Clean up the interval when unmounting
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading && scores.length === 0) {
    return <div className="leaderboard-container">Loading top borrowers...</div>;
  }

  if (error) {
    return (
      <div className="leaderboard-container error">
        {error}
        <button onClick={fetchLeaderboard} className="refresh-button">↻</button>
      </div>
    );
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
      
      {scores.length === 0 ? (
        <p>No loans approved yet. Be the first!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>R</th>
              <th>Name</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr 
                key={`${score.name}-${score.score}-${index}`} 
                className={index < 3 ? 'top-scorer' : ''}
              >
                <td>{index + 1}</td>
                <td>{score.name || 'Unknown'}</td>
                <td>{score.score || '0'}</td>
                <td>{score.date || 'Today'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard; 