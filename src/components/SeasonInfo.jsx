import { useState, useEffect, useCallback, memo } from 'react';
import { getCurrentSeason } from '../utils/apiConfig';

const SeasonInfo = ({ isDetailed = false, isVertical = true }) => {
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch current season data
  const fetchSeasonData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCurrentSeason();
      setSeasonData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching season data:', err);
      setError('Failed to load season data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Expose fetch method globally to allow manual refresh after payment
  useEffect(() => {
    window.refreshSeasonInfo = fetchSeasonData;
    
    return () => {
      window.refreshSeasonInfo = undefined;
    };
  }, [fetchSeasonData]);

  useEffect(() => {
    fetchSeasonData();
    
    // Update season data every 30 seconds
    const intervalId = setInterval(fetchSeasonData, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchSeasonData]);

  // Format date in readable format
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="season-info loading">
        <p>Loading season information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="season-info error">
        <p>{error}</p>
      </div>
    );
  }

  if (!seasonData) {
    return (
      <div className="season-info no-data">
        <p>No active season found</p>
      </div>
    );
  }

  // Display time remaining in a readable format
  const formatTimeRemaining = () => {
    if (!seasonData.timeRemaining) return 'Calculating...';
    
    const { days, hours, minutes } = seasonData.timeRemaining;
    
    if (days === 0 && hours === 0 && minutes === 0) {
      return 'Season ended';
    }
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Grid layout (horizontal)
  const renderGridLayout = () => (
    <div className="season-stats">
      <div className="season-stat">
        <div className="stat-label">Prize Pool</div>
        <div className="stat-value">
          <span className="crypto-amount">{parseFloat(seasonData.potSize).toFixed(4)} ETH</span>
        </div>
      </div>
      
      <div className="season-stat">
        <div className="stat-label">Players</div>
        <div className="stat-value">{seasonData.playerCount}</div>
      </div>
      
      <div className="season-stat time-remaining">
        <div className="stat-label">Time Left</div>
        <div className="stat-value countdown">{formatTimeRemaining()}</div>
      </div>
    </div>
  );

  // Show prize distribution - compact format
  const renderPrizeDistribution = () => (
    <div className="prize-distribution">
      <div className="prize-item">
        <span className="prize-rank">1st PLACE:</span>
        <span className="prize-value"><span className="crypto-amount">50%</span> OF THE POT</span>
      </div>
      <div className="prize-item">
        <span className="prize-rank">2nd PLACE:</span>
        <span className="prize-value"><span className="crypto-amount">30%</span> OF THE POT</span>
      </div>
      <div className="prize-item">
        <span className="prize-rank">3rd PLACE:</span>
        <span className="prize-value"><span className="crypto-amount">10%</span> OF THE POT</span>
      </div>
      <div className="prize-item">
        <span className="prize-rank">4th PLACE:</span>
        <span className="prize-value"><span className="crypto-amount">5%</span> OF THE POT</span>
      </div>
      <div className="prize-item">
        <span className="prize-rank">5th PLACE:</span>
        <span className="prize-value"><span className="crypto-amount">5%</span> OF THE POT</span>
      </div>
    </div>
  );

  // Vertical layout (more compact)
  const renderVerticalLayout = () => (
    <div className="season-stats vertical">
      <div className="season-stat">
        <div className="stat-label">Prize Pool:</div>
        <div className="stat-value">
          <span className="crypto-amount">{parseFloat(seasonData.potSize).toFixed(4)} ETH</span>
        </div>
      </div>
      
      <div className="season-stat">
        <div className="stat-label">Players:</div>
        <div className="stat-value">{seasonData.playerCount}</div>
      </div>
      
      <div className="season-stat">
        <div className="stat-label">Time Left:</div>
        <div className="stat-value countdown">{formatTimeRemaining()}</div>
      </div>

      {isDetailed && (
        <>
          <div className="season-stat">
            <div className="stat-label">Started:</div>
            <div className="stat-value">{formatDate(seasonData.startDate)}</div>
          </div>
          
          <div className="season-stat">
            <div className="stat-label">Ends:</div>
            <div className="stat-value">{formatDate(seasonData.endDate)}</div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`season-info ${isDetailed ? 'detailed' : ''} ${isVertical ? 'season-info-vertical' : ''}`}>
      <h3>Current Season #{seasonData.seasonNumber}</h3>
      
      {isVertical ? renderVerticalLayout() : renderGridLayout()}
      
      {isDetailed && !isVertical && (
        <div className="season-dates">
          <div><span className="date-label">Started:</span> {formatDate(seasonData.startDate)}</div>
          <div><span className="date-label">Ends:</span> {formatDate(seasonData.endDate)}</div>
          {renderPrizeDistribution()}
        </div>
      )}
    </div>
  );
};

export default memo(SeasonInfo); 