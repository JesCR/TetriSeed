import { useState, useEffect } from 'react';
import { 
  isMetaMaskInstalled, 
  getMetaMaskDownloadLink, 
  connectWallet, 
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
  
  // Handle click on competitive mode button
  const handleCompetitiveClick = async () => {
    // If already in competitive mode, do nothing
    if (isActive) return;
    
    // If MetaMask is not installed, show install modal
    if (!isMetaMaskInstalled()) {
      setModalType('metamask');
      setShowModal(true);
      return;
    }
    
    // If wallet is not connected, try to connect
    if (!walletConnected) {
      setIsLoading(true);
      setError('');
      
      try {
        const result = await connectWallet();
        if (result.success) {
          setWalletConnected(true);
          setWalletAddress(result.account);
          
          // After connecting wallet, verify network
          const networkResult = await switchToSuperSeedNetwork();
          if (networkResult.success) {
            // Show rules modal
            setModalType('rules');
            setShowModal(true);
          } else {
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
      
      return;
    }
    
    // If wallet is connected but rules not shown, show rules
    if (walletConnected && !isActive) {
      setModalType('rules');
      setShowModal(true);
    }
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
      <button 
        className={`competitive-button ${isActive ? 'active' : ''}`}
        onClick={handleCompetitiveClick}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : (isActive ? 'Competitive Mode Active' : 'Enter Competitive Mode')}
      </button>
      
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