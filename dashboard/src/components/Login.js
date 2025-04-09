import React, { useState } from 'react';
import { connectWallet } from '../utils/web3';
import logoImg from '../assets/images/superseed_logo-removebg.png';

const Login = ({ onLogin }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const { provider, signer, address } = await connectWallet();
      onLogin(provider, signer, address);
    } catch (error) {
      console.error("Login error:", error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img 
          src={logoImg} 
          alt="TetriSeed Logo" 
          style={{ width: '150px', marginBottom: '20px' }} 
        />
        <h2>TetriSeed Admin</h2>
        <p>Connect your wallet to manage the game contract</p>
        {error && <div className="error-message">{error}</div>}
        <button 
          className="btn" 
          onClick={handleConnect} 
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );
};

export default Login; 