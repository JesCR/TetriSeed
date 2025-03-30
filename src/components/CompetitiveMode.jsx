import { useState, useEffect } from 'react';
import { 
  isMetaMaskInstalled, 
  getMetaMaskDownloadLink, 
  connectWallet,
  disconnectWallet,
  switchToSuperSeedNetwork, 
  mockPayCompetitiveFee 
} from '../utils/web3Utils';
import Modal from './Modal';
import SeasonInfo from './SeasonInfo';

const CompetitiveMode = ({ onActivation, isActive = false }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'metamask', 'rules', 'network'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled() && window.ethereum.selectedAddress) {
        setWalletConnected(true);
        setWalletAddress(window.ethereum.selectedAddress);
      }
    };
    
    checkConnection();
  }, []);
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    if (walletConnected) {
      // Disconnect wallet
      try {
        await disconnectWallet();
        setWalletConnected(false);
        setWalletAddress('');
        // If in competitive mode, deactivate it
        if (isActive) {
          onActivation(false, '');
        }
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
      return;
    }
    
    // Connect wallet
    setIsLoading(true);
    setError('');
    
    try {
      if (!isMetaMaskInstalled()) {
        setModalType('metamask');
        setShowModal(true);
        return;
      }
      
      const result = await connectWallet();
      if (result.success) {
        setWalletConnected(true);
        setWalletAddress(result.account);
        
        // After connecting wallet, verify network
        const networkResult = await switchToSuperSeedNetwork();
        if (!networkResult.success) {
          setError(networkResult.error || 'Failed to switch to SuperSeed network');
        }
      } else {
        setError(result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle competitive mode toggle
  const handleCompetitiveModeToggle = async () => {
    if (!walletConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (isActive) {
      // Leave competitive mode
      onActivation(false, walletAddress);
      return;
    }
    
    // Enter competitive mode
    setModalType('rules');
    setShowModal(true);
  };
  
  // Handle confirmation of competitive mode
  const handleConfirmCompetitive = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Mock payment for now
      const paymentResult = await mockPayCompetitiveFee(walletAddress);
      
      if (paymentResult.success) {
        setShowModal(false);
        
        // Notify parent component
        if (onActivation) {
          onActivation(true, walletAddress);
        }
      } else {
        setError(paymentResult.error || 'Payment failed');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  // Render Modal Content based on type
  const renderModalContent = () => {
    switch (modalType) {
      case 'metamask':
        return (
          <div className="competitive-modal-content">
            <h2>MetaMask Required</h2>
            <p>You need to install MetaMask to enter competitive mode.</p>
            <p>MetaMask is a browser extension that lets you interact with the blockchain.</p>
            <div className="competitive-modal-buttons">
              <a
                href={getMetaMaskDownloadLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-button"
              >
                Install MetaMask
              </a>
              <button className="modal-button secondary" onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        );
      
      case 'rules':
        return (
          <div className="competitive-modal-content">
            <h2>Competitive Mode Rules</h2>
            <div className="rules-list">
              <p>1. Every player pays 1 $SUPR per game</p>
              <p>2. All $SUPR are collected in a smart contract</p>
              <p>3. Every season lasts 1 week (Monday to Sunday)</p>
              <p>4. At the end of each season, the top 5 competitive players get prizes:</p>
              <ul>
                <li>1st place: 50% of the pot</li>
                <li>2nd place: 30% of the pot</li>
                <li>3rd place: 10% of the pot</li>
                <li>4th place: 5% of the pot</li>
                <li>5th place: 5% of the pot</li>
              </ul>
              <p>5. After that, a new season starts and the leaderboard is cleared</p>
            </div>
            
            <SeasonInfo isDetailed={true} />
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="competitive-modal-buttons">
              <button 
                className="modal-button" 
                onClick={handleConfirmCompetitive}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Pay 1 $SUPR & Start'}
              </button>
              <button className="modal-button secondary" onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="competitive-mode">
      <div className="game-mode-display">
        <p>Mode: <span className={isActive ? "competitive-mode-active" : "casual-mode"}>
          {isActive ? "Competitive" : "Casual"}
        </span></p>
      </div>
      
      <div className="wallet-buttons">
        {/* FIRST: Connect/Disconnect button */}
        <button 
          className="wallet-button"
          onClick={handleConnectWallet}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : (walletConnected ? 'Disconnect Wallet' : 'Connect Wallet')}
        </button>
        
        {/* SECOND: Competitive mode button (only visible when connected) */}
        {walletConnected && (
          <button 
            className={`competitive-button ${isActive ? 'active' : ''}`}
            onClick={handleCompetitiveModeToggle}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isActive ? 'Leave Competitive' : 'Enter Competitive')}
          </button>
        )}
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <Modal
        isOpen={showModal}
        type="custom"
        onClose={handleCloseModal}
        customContent={renderModalContent()}
      />
    </div>
  );
};

export default CompetitiveMode; 