// Web3 utilities for competitive mode
import { ethers } from 'ethers';
import { getApiUrl } from './apiConfig';

// Network configuration for SuperSeed
const SUPERSEED_NETWORK = {
  chainId: '0x14D2', // 5330 in hex
  chainName: 'Superseed',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.superseed.xyz'],
  blockExplorerUrls: ['https://explorer.superseed.xyz']
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  // Check for MetaMask in browser
  const isMetaMaskInBrowser = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  
  // Check if we're on mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // If on mobile, we can deep link to the MetaMask app
  if (isMobile && !isMetaMaskInBrowser) {
    // Try to detect if MetaMask app is installed by checking if ethereum provider is injected
    // This doesn't always work on first page load, as the provider might not be injected yet
    return typeof window.ethereum !== 'undefined';
  }
  
  return isMetaMaskInBrowser;
};

// Get MetaMask download link
export const getMetaMaskDownloadLink = () => {
  // Check if we're on mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Deep link that will open MetaMask if installed, or go to app store if not
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
      return 'https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202';
    } else if (isAndroid) {
      return 'https://play.google.com/store/apps/details?id=io.metamask';
    }
  }
  
  // Default to browser extension
  return 'https://metamask.io/download/';
};

// Request account access
export const connectWallet = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return { success: true, account: accounts[0] };
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    return { success: false, error: error.message };
  }
};

// Disconnect wallet (for UI purposes only - MetaMask doesn't actually disconnect)
export const disconnectWallet = async () => {
  // This doesn't actually disconnect the wallet as MetaMask doesn't support this
  // It's just for the UI state to represent a disconnected state
  console.log('Wallet "disconnected" (UI state only)');
  return { success: true };
};

// Check if SuperSeed network is added to MetaMask
export const isSuperSeedNetworkAdded = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      return false;
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId.toLowerCase() === SUPERSEED_NETWORK.chainId.toLowerCase();
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Add SuperSeed network to MetaMask
export const addSuperSeedNetwork = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    console.log('Adding SuperSeed mainnet with config:', SUPERSEED_NETWORK);
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [SUPERSEED_NETWORK]
    });
    
    // Verify the network was added successfully
    const isNowAdded = await isSuperSeedNetworkAdded();
    if (!isNowAdded) {
      console.warn('Network appears to be added but verification failed');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding SuperSeed network:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error adding SuperSeed network'
    };
  }
};

// Switch to SuperSeed network
export const switchToSuperSeedNetwork = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    console.log('Checking if SuperSeed network is added...');
    const isAdded = await isSuperSeedNetworkAdded();
    console.log('SuperSeed network already added:', isAdded);
    
    if (!isAdded) {
      console.log('Adding SuperSeed network to MetaMask...');
      const addResult = await addSuperSeedNetwork();
      if (!addResult.success) {
        throw new Error(addResult.error);
      }
      console.log('SuperSeed network added successfully');
    }
    
    console.log('Switching to SuperSeed network...');
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SUPERSEED_NETWORK.chainId }]
    });
    console.log('Successfully switched to SuperSeed network');
    
    return { success: true };
  } catch (error) {
    console.error('Error switching network:', error);
    return { success: false, error: error.message };
  }
};

// Mock payment function (to be replaced with real transaction in the future)
export const mockPayCompetitiveFee = async (account) => {
  try {
    if (!account) {
      throw new Error('No account connected');
    }
    
    // Log the mock payment
    console.log(`Processing payment of 1 $SUPR from ${account}`);
    
    // Call the payment API endpoint
    const response = await fetch(getApiUrl('/api/payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: account }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment API error:', errorText);
      throw new Error('Failed to process payment');
    }
    
    const data = await response.json();
    console.log('Payment successful:', data);
    
    return { 
      success: true, 
      txHash: data.txHash || `mock_tx_${Date.now()}`,
      potSize: data.potSize,
      playerCount: data.playerCount
    };
  } catch (error) {
    console.error('Error in payment:', error);
    return { success: false, error: error.message };
  }
}; 