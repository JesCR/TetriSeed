import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

const SeasonHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(null);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/season-history`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch season history');
        }
        
        const data = await response.json();
        setHistory(data.sort((a, b) => b.seasonNumber - a.seasonNumber));
        
        // Select the most recent season by default
        if (data.length > 0 && !selectedSeason) {
          setSelectedSeason(data[0].seasonNumber);
        }
      } catch (error) {
        console.error('Error fetching season history:', error);
        setError('Could not load season history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [selectedSeason]);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Format wallet address to short form (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const getSelectedSeasonData = () => {
    return history.find(season => season.seasonNumber === selectedSeason);
  };
  
  const selectSeason = (seasonNumber) => {
    setSelectedSeason(seasonNumber);
  };
  
  const selectedSeasonData = getSelectedSeasonData();
  
  return (
    <div className="season-history">
      <h3>Season History</h3>
      
      {loading ? (
        <p className="loading-text">Loading season history...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : history.length === 0 ? (
        <p className="empty-text">No season history available yet.</p>
      ) : (
        <>
          <div className="season-selector">
            {history.map(season => (
              <button 
                key={season.seasonNumber}
                className={selectedSeason === season.seasonNumber ? 'active' : ''}
                onClick={() => selectSeason(season.seasonNumber)}
              >
                Season {season.seasonNumber}
              </button>
            ))}
          </div>
          
          {selectedSeasonData && (
            <div className="season-details">
              <div className="season-summary">
                <p className="season-dates">
                  {formatDate(selectedSeasonData.startDate)} - {formatDate(selectedSeasonData.endDate)}
                </p>
                <p className="season-pot">
                  Total Pot: <span>{selectedSeasonData.totalPot}</span> $SUPR
                </p>
                <p className="season-players">
                  Total Players: <span>{selectedSeasonData.playerCount}</span>
                </p>
              </div>
              
              <h4>Winners</h4>
              <div className="season-winners">
                {selectedSeasonData.winners.length > 0 ? (
                  <table className="winners-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Score</th>
                        <th>Prize</th>
                        <th>Wallet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSeasonData.winners.map((winner, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{winner.name}</td>
                          <td>{winner.score}</td>
                          <td>{winner.prize} $SUPR</td>
                          <td title={winner.address}>{formatAddress(winner.address)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-text">No winners for this season.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonHistory; 