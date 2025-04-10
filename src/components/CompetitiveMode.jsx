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
  const [connectionAttempt, setConnectionAttempt] = useState(0); // Track connection attempts
  
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
      // Add a short delay after MetaMask isolation before checking connection
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
    
    // Handle network changes without showing modal
    const handleNetworkChange = async (event) => {
      console.log('Network changed event received:', event.detail);
      
      // Don't show any modals during network changes
      const oldModalState = showModal;
      if (showModal) {
        setShowModal(false);
      }
      
      // Check if wallet is still connected after network change
      try {
        const { connected, address } = await checkInitialWalletConnection();
        if (connected && address) {
          // Wallet is still connected, just update the state
          setWalletConnected(true);
          setWalletAddress(address);
          
          // If not on SuperSeed network, try to switch back
          if (!event.detail.isSuperSeedNetwork) {
            console.log('Network changed to non-SuperSeed network, attempting to switch back');
            try {
              const networkResult = await switchToSuperSeedNetwork();
              if (!networkResult.success) {
                setError('Please switch to SuperSeed network for best experience');
              } else {
                setError(''); // Clear any error messages
              }
            } catch (switchErr) {
              console.error('Error switching to SuperSeed network:', switchErr);
              setError('Please switch to SuperSeed network for best experience');
            }
          } else {
            // Clear any network-related error messages
            setError('');
          }
        } else {
          // Wallet got disconnected during network change
          setWalletConnected(false);
          setWalletAddress('');
          
          // If in competitive mode, deactivate it
          if (isActive && onActivation) {
            onActivation(false, '');
          }
          
          // Don't show modal here
        }
      } catch (err) {
        console.error('Error checking connection after network change:', err);
      }
    };
    
    // Add listener for network changes
    window.addEventListener('network_changed', handleNetworkChange);
    
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
      window.removeEventListener('network_changed', handleNetworkChange);
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
    
    // Increase connection attempt counter
    setConnectionAttempt(prev => prev + 1);
    
    // Connect wallet (desktop only)
    console.log('Starting wallet connection from CompetitiveMode, attempt:', connectionAttempt + 1);
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Checking if MetaMask is installed');
      if (!isMetaMaskInstalled()) {
        console.log('MetaMask not installed, showing modal');
        setModalType('metamask');
        setShowModal(true);
        setIsLoading(false);
        return;
      }
      
      // Add longer delay for subsequent attempts
      const delayTime = connectionAttempt > 0 ? 1000 : 500;
      console.log(`Adding ${delayTime}ms delay to ensure MetaMask initialization`);
      await new Promise(resolve => setTimeout(resolve, delayTime));
      
      console.log('Calling connectWallet()');
      const result = await connectWallet();
      console.log('Result from connectWallet:', result);
      
      if (result.success) {
        console.log('Successfully connected wallet in CompetitiveMode:', result.account);
        setWalletConnected(true);
        setWalletAddress(result.account);
        setConnectionAttempt(0); // Reset attempts on success
        
        // Dispatch a custom event with the wallet address to notify all components
        window.dispatchEvent(new CustomEvent('wallet_connected', {
          detail: { address: result.account }
        }));
        
        // Automatically switch to SuperSeed network after connecting
        try {
          console.log('Attempting to switch to SuperSeed network');
          const networkResult = await switchToSuperSeedNetwork();
          if (!networkResult.success) {
            console.log('Network switch failed:', networkResult.error);
            setError('Please switch to SuperSeed network for best experience');
          } else {
            console.log('Successfully switched to SuperSeed network');
            setError(''); // Clear any error messages
          }
        } catch (networkErr) {
          console.error('Error switching to SuperSeed network:', networkErr);
          setError('Please switch to SuperSeed network for best experience');
        }
      } else {
        console.log('Failed to connect wallet:', result.error);
        
        // If this is a first attempt failure, suggest trying again
        if (connectionAttempt === 0) {
          setError('Connection failed. Please try again or check if MetaMask is unlocked.');
        } else {
          // For multiple failures, give more specific instructions
          setError(result.error || 'Failed to connect wallet. Try refreshing the page or restarting your browser.');
        }
      }
    } catch (error) {
      console.log('Error caught in handleConnectWallet:', error);
      setError(error.message || 'An error occurred');
    } finally {
      console.log('Finishing handleConnectWallet, setting isLoading to false');
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
            <div className="competitive-modal-buttons">
              <a
                href={getMetaMaskDownloadLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-button primary-button"
              >
                Install
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
  
  // Show retry button if we've had a failed connection attempt
  const renderRetryButton = () => {
    if (error && !walletConnected && connectionAttempt > 0) {
      return (
        <button 
          className="retry-button"
          onClick={() => {
            console.log('Retrying wallet connection');
            setError('');
            handleConnectWallet();
          }}
        >
          Retry Connection
        </button>
      );
    }
    return null;
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
          {isLoading ? 'Processing...' : (walletConnected ? 'Disconnect Wallet' : 'Connect to SuperSeed')}
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
      
      {/* Add retry button when connection fails */}
      {renderRetryButton()}
      
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