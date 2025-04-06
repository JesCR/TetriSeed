import { useState, useEffect } from 'react';
import { 
  isMetaMaskInstalled, 
  getMetaMaskDownloadLink, 
  connectWallet,
  disconnectWallet,
  switchToSuperSeedNetwork,
  checkInitialWalletConnection,
  setupWalletListeners
} from '../utils/web3Utils';
import Modal from './Modal';

const CompetitiveMode = ({ onActivation, isActive = false }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'metamask', 'mobile-warning'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Check if wallet is already connected using our improved function
  useEffect(() => {
    const checkConnection = async () => {
      const { connected, address } = await checkInitialWalletConnection();
      if (connected && address) {
        setWalletConnected(true);
        setWalletAddress(address);
      } else {
        // Make sure to clear the state if the wallet is not connected
        setWalletConnected(false);
        setWalletAddress('');
        // If in competitive mode, deactivate it
        if (isActive && onActivation) {
          onActivation(false, '');
        }
      }
    };
    
    checkConnection();
    
    // Setup wallet connection listeners
    const cleanupWalletListeners = setupWalletListeners(
      // onAccountsChanged callback
      (newAccount) => {
        console.log('Wallet account changed in CompetitiveMode:', newAccount);
        setWalletConnected(true);
        setWalletAddress(newAccount);
      },
      // onDisconnect callback
      () => {
        console.log('Wallet disconnected in CompetitiveMode');
        setWalletConnected(false);
        setWalletAddress('');
        // If in competitive mode, deactivate it
        if (isActive && onActivation) {
          onActivation(false, '');
        }
      }
    );
    
    // Also perform periodic checks to ensure UI stays in sync
    const connectionCheckInterval = setInterval(async () => {
      if (!isMetaMaskInstalled() || !window.ethereum) {
        if (walletConnected) {
          setWalletConnected(false);
          setWalletAddress('');
          if (isActive && onActivation) {
            onActivation(false, '');
          }
        }
        return;
      }
      
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts',
          params: []
        });
        
        if (!accounts || accounts.length === 0) {
          // Only update if we're changing from connected to disconnected
          if (walletConnected) {
            console.log('Periodic check found wallet disconnected in CompetitiveMode');
            setWalletConnected(false);
            setWalletAddress('');
            if (isActive && onActivation) {
              onActivation(false, '');
            }
          }
        }
      } catch (error) {
        console.error('Error in periodic wallet check:', error);
      }
    }, 3000);
    
    // Cleanup listeners on component unmount
    return () => {
      if (cleanupWalletListeners) {
        cleanupWalletListeners();
      }
      clearInterval(connectionCheckInterval);
    };
  }, [isActive, onActivation, walletConnected]);
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    if (walletConnected) {
      // Disconnect wallet
      try {
        console.log('Disconnecting wallet from CompetitiveMode button');
        setIsLoading(true);
        const result = await disconnectWallet();
        setIsLoading(false);
        
        if (result.success) {
          console.log('Successfully disconnected wallet');
          setWalletConnected(false);
          setWalletAddress('');
          
          // If in competitive mode, deactivate it
          if (isActive && onActivation) {
            onActivation(false, '');
          }
          
          // Force trigger an event to notify all components
          window.dispatchEvent(new Event('wallet_state_changed'));
        } else {
          setError(result.error || 'Failed to disconnect wallet');
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error disconnecting wallet:', error);
        setError(error.message || 'An error occurred while disconnecting');
      }
      return;
    }
    
    // If on mobile, show full-screen overlay warning instead of trying to connect
    if (isMobile) {
      // Use direct DOM manipulation to create and show a full-screen overlay
      const overlay = document.createElement('div');
      overlay.className = 'mobile-overlay';
      overlay.innerHTML = `
        <div class="mobile-overlay-content">
          <button class="close-button">×</button>
          <h3>Desktop Only Feature</h3>
          <div class="warning-icon">⚠️</div>
          <p>Competitive mode requires a wallet connection and is only available on desktop browsers.</p>
          <p>Please visit <span class="highlight">tetriseed.xyz</span> from your computer to play competitive mode.</p>
          <button class="dismiss-button">Got it</button>
        </div>
      `;
      document.body.appendChild(overlay);
      
      // Add event listeners to close buttons
      const closeBtn = overlay.querySelector('.close-button');
      const dismissBtn = overlay.querySelector('.dismiss-button');
      
      const removeOverlay = () => {
        document.body.removeChild(overlay);
      };
      
      closeBtn.addEventListener('click', removeOverlay);
      dismissBtn.addEventListener('click', removeOverlay);
      
      return;
    }
    
    // Connect wallet (desktop only)
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
        console.log('Successfully connected wallet in CompetitiveMode:', result.account);
        setWalletConnected(true);
        setWalletAddress(result.account);
        
        // Dispatch a custom event with the wallet address to notify all components
        window.dispatchEvent(new CustomEvent('wallet_connected', {
          detail: { address: result.account }
        }));
        
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
          <div className="competitive-modal-content metamask-modal">
            <h3>MetaMask Required</h3>
            <p className="metamask-info">You need to install MetaMask to enter competitive mode.</p>
            <p className="metamask-info">MetaMask is a secure crypto wallet for blockchain interactions.</p>
            <div className="competitive-modal-buttons">
              <a
                href={getMetaMaskDownloadLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-button primary-button"
              >
                Install MetaMask
              </a>
              <button className="modal-button secondary-button" onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        );
      case 'mobile-warning':
        return (
          <div className="competitive-modal-content mobile-warning-modal">
            <h3>Desktop Only</h3>
            <div className="warning-icon">⚠️</div>
            <p className="mobile-warning-info">
              Competitive mode requires a desktop browser
            </p>
            <div className="competitive-modal-buttons">
              <button className="modal-button primary-button" onClick={handleCloseModal}>
                Got it
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
      <div className={`wallet-buttons ${walletConnected ? 'wallet-connected' : ''}`}>
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