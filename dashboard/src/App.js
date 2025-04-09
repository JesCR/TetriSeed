import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getContract, isContractOwner } from './utils/web3';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (providerInstance, signerInstance, userAddress) => {
    setLoading(true);
    setAuthError('');
    
    try {
      setProvider(providerInstance);
      setSigner(signerInstance);
      setAddress(userAddress);
      setIsAuthenticated(true);
      
      // Check if the connected address is the contract owner
      const contract = await getContract(signerInstance);
      const isOwner = await isContractOwner(userAddress, contract);
      
      if (isOwner) {
        setIsAuthorized(true);
      } else {
        setAuthError('You are not authorized to access this dashboard. Only the contract owner has access.');
      }
    } catch (error) {
      console.error("Authorization error:", error);
      setAuthError('Failed to verify authorization. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verifying Authorization</h2>
          <div className="loading">Please wait...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Access Denied</h2>
          <div className="error-message">{authError}</div>
          <p>Connected as: <span className="eth-address">{address}</span></p>
        </div>
      </div>
    );
  }
  
  return <Dashboard signer={signer} address={address} />;
}

export default App; 