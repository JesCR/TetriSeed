import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract, formatEther, parseEther } from '../utils/web3';
import Header from './Header';

const Dashboard = ({ signer, address }) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Contract data
  const [entryFee, setEntryFee] = useState('0');
  const [prizePool, setPrizePool] = useState('0');
  const [prizeDistribution, setPrizeDistribution] = useState([0, 0, 0, 0, 0]);
  const [currentSeason, setCurrentSeason] = useState('0');
  const [seasonEndTime, setSeasonEndTime] = useState('0');
  
  // Form states
  const [newFee, setNewFee] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [distribution, setDistribution] = useState(['50', '30', '10', '5', '5']);
  const [winners, setWinners] = useState(['', '', '', '', '']);
  
  // Status messages
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  
  // Initialize contract and load data
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const contractInstance = await getContract(signer);
        setContract(contractInstance);
        
        // Load contract data
        const fee = await contractInstance.entryFee();
        setEntryFee(formatEther(fee));
        
        const pool = await contractInstance.weeklyPrizePool();
        setPrizePool(formatEther(pool));
        
        const dist = await contractInstance.getPrizeDistribution();
        setPrizeDistribution(dist);
        
        const season = await contractInstance.currentSeason();
        setCurrentSeason(season.toString());
        
        const endTime = await contractInstance.getCurrentSeasonEndTime();
        setSeasonEndTime(endTime.toString());
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing contract:", error);
        setError("Failed to load contract data");
        setLoading(false);
      }
    };
    
    init();
  }, [signer, refreshTrigger]);
  
  // Helper function to refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };
  
  // Handle form submissions
  const updateEntryFee = async (e) => {
    e.preventDefault();
    try {
      setStatusMessage("Updating entry fee...");
      setError("");
      
      const tx = await contract.setEntryFee(parseEther(newFee));
      await tx.wait();
      
      setStatusMessage("Entry fee updated successfully!");
      setNewFee("");
      refreshData();
    } catch (error) {
      console.error("Error updating entry fee:", error);
      setError("Failed to update entry fee");
      setStatusMessage("");
    }
  };
  
  const updateDistribution = async (e) => {
    e.preventDefault();
    try {
      setStatusMessage("Updating prize distribution...");
      setError("");
      
      // Ensure all values are integers, not strings
      const distValues = distribution.map(v => parseInt(v));
      
      // Check if sum is 100
      const sum = distValues.reduce((a, b) => a + b, 0);
      if (sum !== 100) {
        setError("Distribution percentages must sum to 100%");
        setStatusMessage("");
        return;
      }
      
      const tx = await contract.setDistribution(distValues);
      await tx.wait();
      
      setStatusMessage("Prize distribution updated successfully!");
      refreshData();
    } catch (error) {
      console.error("Error updating distribution:", error);
      setError("Failed to update prize distribution");
      setStatusMessage("");
    }
  };
  
  const withdrawFunds = async (e) => {
    e.preventDefault();
    try {
      setStatusMessage("Withdrawing funds...");
      setError("");
      
      const tx = await contract.ownerWithdraw(parseEther(withdrawAmount));
      await tx.wait();
      
      setStatusMessage("Funds withdrawn successfully!");
      setWithdrawAmount("");
      refreshData();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      setError("Failed to withdraw funds");
      setStatusMessage("");
    }
  };
  
  const endSeason = async (e) => {
    e.preventDefault();
    try {
      // Validate all winner addresses
      if (winners.some(addr => !ethers.isAddress(addr))) {
        setError("One or more winner addresses are invalid");
        return;
      }
      
      setStatusMessage("Ending season and distributing prizes...");
      setError("");
      
      const tx = await contract.endSeason(winners);
      await tx.wait();
      
      setStatusMessage("Season ended and prizes distributed successfully!");
      setWinners(['', '', '', '', '']);
      refreshData();
    } catch (error) {
      console.error("Error ending season:", error);
      setError("Failed to end season");
      setStatusMessage("");
    }
  };
  
  // Handle distribution input changes
  const handleDistributionChange = (index, value) => {
    const newDist = [...distribution];
    newDist[index] = value;
    setDistribution(newDist);
  };
  
  // Handle winner address input changes
  const handleWinnerChange = (index, value) => {
    const newWinners = [...winners];
    newWinners[index] = value;
    setWinners(newWinners);
  };
  
  if (loading) {
    return (
      <div className="container">
        <Header address={address} />
        <div className="loading">Loading contract data...</div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <Header address={address} />
      
      {statusMessage && <div className="success-message">{statusMessage}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard">
        {/* Contract Info Card */}
        <div className="card">
          <h2>Contract Info</h2>
          <div className="data-row">
            <span>Entry Fee:</span>
            <span>{entryFee} ETH</span>
          </div>
          <div className="data-row">
            <span>Prize Pool:</span>
            <span>{prizePool} ETH</span>
          </div>
          <div className="data-row">
            <span>Current Season:</span>
            <span>{currentSeason}</span>
          </div>
          <div className="data-row">
            <span>Season Ends:</span>
            <span>{formatDate(seasonEndTime)}</span>
          </div>
          <button className="btn" onClick={refreshData}>Refresh Data</button>
        </div>
        
        {/* Prize Distribution Card */}
        <div className="card">
          <h2>Prize Distribution</h2>
          {prizeDistribution.map((percent, index) => (
            <div className="data-row" key={index}>
              <span>Rank {index + 1}:</span>
              <span>{percent}%</span>
            </div>
          ))}
        </div>
        
        {/* Update Fee Card */}
        <div className="card">
          <h2>Update Entry Fee</h2>
          <form onSubmit={updateEntryFee}>
            <div className="form-group">
              <label>New Fee (ETH)</label>
              <input 
                type="text" 
                value={newFee} 
                onChange={(e) => setNewFee(e.target.value)}
                placeholder="0.0001"
                required
              />
            </div>
            <button type="submit" className="btn">Update Fee</button>
          </form>
        </div>
        
        {/* Update Distribution Card */}
        <div className="card">
          <h2>Update Prize Distribution</h2>
          <form onSubmit={updateDistribution}>
            {distribution.map((value, index) => (
              <div className="form-group" key={index}>
                <label>Rank {index + 1} (%)</label>
                <input 
                  type="number" 
                  value={value} 
                  onChange={(e) => handleDistributionChange(index, e.target.value)}
                  min="0"
                  max="100"
                  required
                />
              </div>
            ))}
            <button type="submit" className="btn">Update Distribution</button>
          </form>
        </div>
        
        {/* Withdraw Funds Card */}
        <div className="card">
          <h2>Withdraw Funds</h2>
          <form onSubmit={withdrawFunds}>
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input 
                type="text" 
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.01"
                required
              />
            </div>
            <button type="submit" className="btn">Withdraw</button>
          </form>
        </div>
        
        {/* End Season Card */}
        <div className="card">
          <h2>End Season &amp; Distribute Prizes</h2>
          <form onSubmit={endSeason}>
            {winners.map((addr, index) => (
              <div className="form-group" key={index}>
                <label>Winner Rank {index + 1}</label>
                <input 
                  type="text" 
                  value={addr} 
                  onChange={(e) => handleWinnerChange(index, e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
            ))}
            <button type="submit" className="btn">End Season</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 