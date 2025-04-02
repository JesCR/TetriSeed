import { useState, useEffect, useCallback, memo } from 'react';
import { getSeasonHistory } from '../utils/apiConfig';

const SeasonHistory = () => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch season history data
  const fetchSeasonHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSeasonHistory();
      
      // Map the data to standardize property names
      const formattedData = data.map(season => ({
        seasonNumber: season.season,
        startDate: season.startDate,
        endDate: season.endDate,
        potSize: season.potSize,
        playerCount: season.playerCount || 0,
        gameCount: season.gameCount || 0,
        winners: Array.isArray(season.winners) ? season.winners : []
      }));
      
      // Sort seasons in descending order (most recent first)
      formattedData.sort((a, b) => b.seasonNumber - a.seasonNumber);
      
      setSeasons(formattedData);
      setError('');
    } catch (err) {
      console.error('Error fetching season history:', err);
      setError('Failed to load season history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonHistory();
  }, [fetchSeasonHistory]);

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

  // Format wallet address to show only first 6 characters
  const formatAddress = useCallback((address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...`;
  }, []);

  if (loading) {
    return (
      <div className="season-history loading">
        <h3>Season History</h3>
        <p>Loading season history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="season-history error">
        <h3>Season History</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="season-history empty">
        <h3>Season History</h3>
        <p>No past seasons found</p>
      </div>
    );
  }

  return (
    <div className="season-history">
      <h3>Season History</h3>
      
      <div className="seasons-list-container">
        <div className="seasons-list">
          {seasons.map((season) => (
            <div key={season.seasonNumber} className="past-season">
              <div className="season-header">
                <h4>Season {season.seasonNumber}</h4>
                <span className="season-dates">
                  {formatDate(season.startDate)} - {formatDate(season.endDate)}
                </span>
              </div>
              
              <div className="season-details">
                <div className="pot-size">
                  <span className="label">Prize Pool:</span>
                  <span className="value"><span className="crypto-amount">{season.potSize} $SUPR</span></span>
                </div>
                <div className="stats-row">
                  <div className="player-count">
                    <span className="label">Players:</span>
                    <span className="value">{season.playerCount}</span>
                  </div>
                  <div className="game-count">
                    <span className="label">Games Played:</span>
                    <span className="value">{season.gameCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="winners">
                <h5>Winners</h5>
                <ol className="winners-list">
                  {season.winners && season.winners.map((winner, index) => (
                    <li key={index} className="winner-item">
                      <div className="winner-details">
                        <span className="winner-rank">#{winner.rank}</span>
                        <span className="winner-name">{winner.name || 'Player ' + (index + 1)}</span>
                        <span className="winner-address">{formatAddress(winner.address)}</span>
                        <span className="winner-prize"><span className="crypto-amount">{winner.prize} $SUPR</span></span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(SeasonHistory); 