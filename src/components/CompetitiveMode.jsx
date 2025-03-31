import { useState, useEffect } from 'react';
import { 
  isMetaMaskInstalled, 
  getMetaMaskDownloadLink, 
  connectWallet,
  disconnectWallet,
  switchToSuperSeedNetwork
} from '../utils/web3Utils';
import Modal from './Modal';

const CompetitiveMode = ({ onActivation, isActive = false }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'metamask' only now
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
  
  // Handle competitive mode toggle - now directly activates/deactivates
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
    
    // Directly activate competitive mode
    if (onActivation) {
      onActivation(true, walletAddress);
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
      default:
        return null;
    }
  };
  
  return (
    <div className="competitive-mode">
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