import React from 'react';
import { disconnectWallet } from '../utils/web3';
import logoImg from '../assets/images/superseed_logo-removebg.png';

const Header = ({ address }) => {
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={logoImg} 
          alt="TetriSeed Logo" 
          style={{ width: '40px', marginRight: '15px' }} 
        />
        <h1>TetriSeed Admin</h1>
      </div>
      <div>
        <span className="eth-address">{formatAddress(address)}</span>
        <button 
          className="btn" 
          onClick={disconnectWallet}
          style={{ marginLeft: '10px' }}
        >
          Disconnect
        </button>
      </div>
    </header>
  );
};

export default Header; 