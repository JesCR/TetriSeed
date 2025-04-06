import { useState, useEffect, useRef } from 'react';
import { getWalletBalance, getUSDCBalance, isMetaMaskInstalled } from '../utils/web3Utils';

const WalletInfo = ({ walletAddress, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  console.log('WalletInfo rendering with address:', walletAddress ? `${walletAddress.slice(0, 8)}...` : 'none');

  // Format wallet address to show only first 5 characters
  const formattedAddress = walletAddress ? 
    `${walletAddress.slice(0, 5)}...` : '';

  // Listen for custom wallet events
  useEffect(() => {
    const handleWalletConnected = (event) => {
      console.log('Wallet connected event received in WalletInfo with address:', 
        event.detail?.address ? `${event.detail.address.slice(0, 8)}...` : 'none');
      
      // Force fetch balances when a wallet connects
      if (event.detail?.address && event.detail.address === walletAddress) {
        fetchBalances(walletAddress);
      }
    };
    
    const handleWalletDisconnect = () => {
      console.log('Custom disconnect event received in WalletInfo');
      setIsOpen(false);
      setEthBalance('0');
      setUsdcBalance('0');
    };
    
    window.addEventListener('wallet_connected', handleWalletConnected);
    window.addEventListener('wallet_disconnected', handleWalletDisconnect);
    
    return () => {
      window.removeEventListener('wallet_connected', handleWalletConnected);
      window.removeEventListener('wallet_disconnected', handleWalletDisconnect);
    };
  }, [walletAddress]);

  // Fetch balances function (extracted for reuse)
  const fetchBalances = async (address) => {
    if (!address) return;
    
    console.log('Fetching balances for wallet:', address.slice(0, 8) + '...');
    setIsLoading(true);
    try {
      // Get ETH balance
      const ethResult = await getWalletBalance(address);
      if (ethResult.success) {
        setEthBalance(parseFloat(ethResult.balance).toFixed(4));
      }
      
      // Get USDC balance
      const usdcResult = await getUSDCBalance(address);
      if (usdcResult.success) {
        setUsdcBalance(parseFloat(usdcResult.balance).toFixed(2));
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balances when wallet address changes or dropdown opens
  useEffect(() => {
    // Always fetch balances immediately when wallet address changes
    if (walletAddress) {
      fetchBalances(walletAddress);
    } else {
      // Reset state when wallet disconnects
      setEthBalance('0');
      setUsdcBalance('0');
      setIsOpen(false);
    }

    // Also fetch when dropdown opens
    if (isOpen && walletAddress) {
      fetchBalances(walletAddress);
    }
  }, [walletAddress, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // For debugging - log when component would render
  console.log('WalletInfo render decision:', { walletAddress: !!walletAddress });

  // Don't render anything if no wallet is connected
  if (!walletAddress) {
    console.log('WalletInfo not rendering due to no wallet address');
    return null;
  }

  return (
    <div className="wallet-info-container" ref={dropdownRef}>
      <button 
        className="wallet-info-button" 
        onClick={toggleDropdown}
        aria-label="View wallet information"
        title="View wallet information"
        style={isMobile ? { padding: '0', minWidth: 'auto' } : {}}
      >
        <span className="wallet-icon">👛</span> {!isMobile && formattedAddress}
      </button>
      
      {isOpen && (
        <div className="wallet-info-dropdown">
          <h3 className="wallet-dropdown-title">Wallet Info</h3>
          
          <div className="wallet-address">
            <span>Address:</span>
            <span>{walletAddress}</span>
          </div>
          
          <div className="wallet-balance eth-balance">
            <span>ETH:</span>
            <span>
              {isLoading ? (
                <span className="loading-spinner">⟳</span>
              ) : (
                <>{ethBalance} <span className="currency">ETH</span></>
              )}
            </span>
          </div>
          
          <div className="wallet-balance usdc-balance">
            <span>USDC:</span>
            <span>
              {isLoading ? (
                <span className="loading-spinner">⟳</span>
              ) : (
                <>{usdcBalance} <span className="currency">USDC</span></>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletInfo; 