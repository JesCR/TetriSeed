import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

const SeasonInfo = ({ isDetailed = false }) => {
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        setLoading(true);
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/current-season`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch season data');
        }
        
        const data = await response.json();
        setSeasonData(data);
      } catch (error) {
        console.error('Error fetching season data:', error);
        setError('Could not load season info');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSeasonData();
    
    // Refresh season data every minute
    const intervalId = setInterval(fetchSeasonData, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (loading) {
    return <div className="season-info-loading">Loading season info...</div>;
  }
  
  if (error) {
    return <div className="season-info-error">{error}</div>;
  }
  
  if (!seasonData) {
    return <div className="season-info-error">No season data available</div>;
  }
  
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };
  
  const startDate = formatDate(seasonData.startDate);
  const endDate = formatDate(seasonData.endDate);
  
  return (
    <div className={`season-info ${isDetailed ? 'detailed' : ''}`}>
      <h3>Current Season #{seasonData.currentSeason}</h3>
      
      <div className="season-stats">
        <div className="season-stat">
          <div className="stat-label">Current Pot</div>
          <div className="stat-value">{seasonData.potSize} $SUPR</div>
        </div>
        
        <div className="season-stat">
          <div className="stat-label">Players</div>
          <div className="stat-value">{seasonData.playerCount}</div>
        </div>
        
        <div className="season-stat">
          <div className="stat-label">Time Remaining</div>
          <div className="stat-value countdown">
            {seasonData.timeRemaining.days}d {seasonData.timeRemaining.hours}h {seasonData.timeRemaining.minutes}m
          </div>
        </div>
      </div>
      
      {isDetailed && (
        <div className="season-dates">
          <div>Season Start: {startDate}</div>
          <div>Season End: {endDate}</div>
        </div>
      )}
    </div>
  );
};

export default SeasonInfo; 