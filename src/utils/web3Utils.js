// Web3 utilities for competitive mode
import { ethers } from 'ethers';
import { getApiUrl } from './apiConfig';

// Network configuration - Add Sepolia testnet and mainnet configurations
const NETWORK_CONFIG = {
  mainnet: {
    chainId: '0x14D2', // 5330 in hex
    chainName: 'Superseed',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.superseed.xyz'],
    blockExplorerUrls: ['https://explorer.superseed.xyz']
  },
  testnet: {
    chainId: '0xD036', // 53302 in hex (correct value)
    chainName: 'Superseed Sepolia Testnet',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.superseed.xyz'],
    blockExplorerUrls: ['https://explorer-sepolia-superseed-826s35710w.t.conduit.xyz']
  }
};

// Default to testnet as specified
const DEFAULT_NETWORK = 'testnet';

// USDC token contracts for each network
export const USDC_CONTRACTS = {
  mainnet: '0x0459d257914d1c1b08D6Fb98Ac2fe17b02633EAD',
  testnet: '0x85773169ee07022AA2b4785A5e69803540E9106A'
};

// Function to get current network configuration
export const getCurrentNetwork = () => {
  // This could be expanded to read from localStorage, URL params, etc.
  return NETWORK_CONFIG[DEFAULT_NETWORK];
};

// Get the active SuperSeed network configuration
export const SUPERSEED_NETWORK = getCurrentNetwork();

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

// Listener for account changes - call this when the app initializes
export const setupWalletListeners = (onAccountsChanged = null, onDisconnect = null) => {
  if (typeof window.ethereum !== 'undefined') {
    // Handle account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('MetaMask accounts changed:', accounts);
      if (accounts.length === 0) {
        // User has disconnected their wallet or logged out of MetaMask
        console.log('User disconnected wallet (accountsChanged event with empty accounts)');
        if (onDisconnect && typeof onDisconnect === 'function') {
          onDisconnect();
        }
      } else if (onAccountsChanged && typeof onAccountsChanged === 'function') {
        onAccountsChanged(accounts[0]);
      }
    });

    // Handle chain changes
    window.ethereum.on('chainChanged', (chainId) => {
      console.log('MetaMask chain changed:', chainId);
      // Reload the page to avoid any state inconsistencies
      window.location.reload();
    });

    // Handle disconnect
    window.ethereum.on('disconnect', (error) => {
      console.log('MetaMask disconnected (disconnect event):', error);
      if (onDisconnect && typeof onDisconnect === 'function') {
        onDisconnect();
      }
    });

    // Handle connection
    window.ethereum.on('connect', (connectInfo) => {
      console.log('MetaMask connected:', connectInfo);
    });

    // Set up a periodic connection check every 5 seconds
    const connectionCheckInterval = setInterval(async () => {
      try {
        // Check if ethereum object still exists
        if (typeof window.ethereum === 'undefined') {
          console.log('Ethereum object no longer available');
          if (onDisconnect && typeof onDisconnect === 'function') {
            onDisconnect();
          }
          clearInterval(connectionCheckInterval);
          return;
        }

        // Try to get accounts - this will fail if disconnected
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts',
          params: []
        });
        
        // If no accounts, consider disconnected
        if (accounts.length === 0) {
          console.log('No accounts found in periodic check, wallet may be disconnected');
          if (onDisconnect && typeof onDisconnect === 'function') {
            onDisconnect();
          }
        }
      } catch (error) {
        console.error('Error in wallet connection check:', error);
        if (error.code === 4100 || error.code === -32603) {
          // These error codes can indicate disconnection
          console.log('Detected potential disconnection from error:', error.code);
          if (onDisconnect && typeof onDisconnect === 'function') {
            onDisconnect();
          }
        }
      }
    }, 5000);

    // Also check when page becomes visible again
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, checking wallet connection');
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts',
            params: []
          });
          
          if (accounts.length === 0) {
            console.log('No accounts found when tab became visible');
            if (onDisconnect && typeof onDisconnect === 'function') {
              onDisconnect();
            }
          }
        } catch (error) {
          console.error('Error checking accounts on visibility change:', error);
        }
      }
    });
    
    // Return a cleanup function
    return () => {
      clearInterval(connectionCheckInterval);
      document.removeEventListener('visibilitychange', () => {});
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('disconnect');
        window.ethereum.removeAllListeners('connect');
      }
    };
  }
  
  // If window.ethereum doesn't exist, return a no-op cleanup function
  return () => {};
};

// Get wallet balance (ETH)
export const getWalletBalance = async (address) => {
  try {
    if (!isMetaMaskInstalled() || !address) {
      return { success: false, error: 'No wallet connected' };
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.utils.formatEther(balance);
    
    return { success: true, balance: ethBalance };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return { success: false, error: error.message };
  }
};

// Get USDC token balance
export const getUSDCBalance = async (address) => {
  try {
    if (!isMetaMaskInstalled() || !address) {
      return { success: false, error: 'No wallet connected' };
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const networkType = DEFAULT_NETWORK;
    const usdcAddress = USDC_CONTRACTS[networkType];
    
    // ERC20 token ABI (just the functions we need)
    const minABI = [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
      }
    ];
    
    const tokenContract = new ethers.Contract(usdcAddress, minABI, provider);
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(address);
    const usdcBalance = ethers.utils.formatUnits(balance, decimals);
    
    return { success: true, balance: usdcBalance };
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return { success: false, error: error.message };
  }
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

// Try alternative way to connect to MetaMask if the standard one fails
export const connectWalletAlternative = async () => {
  try {
    // Check if window.ethereum exists
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    // Try to get provider directly
    let provider;
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
      throw new Error('No Ethereum provider available');
    }
    
    // Request provider's signer (this often triggers the MetaMask popup)
    const signer = provider.getSigner();
    
    // Get the address which requires connection
    const address = await signer.getAddress();
    
    if (!address) {
      throw new Error('Could not get address from provider');
    }
    
    return { success: true, account: address };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Simple direct connection attempt
export const simpleConnectWallet = async () => {
  try {
    // First check if we have ethereum object
    if (typeof window.ethereum === 'undefined') {
      return { success: false, error: 'MetaMask not detected' };
    }
    
    // Try the most direct approach possible
    let accounts = [];
    
    // Approach 1: Use enable() (older method but still works on some setups)
    try {
      if (typeof window.ethereum.enable === 'function') {
        accounts = await window.ethereum.enable();
      }
    } catch (enableError) {
      // Ignore enable error, proceed to next method
    }
    
    // If enable didn't work, try eth_requestAccounts directly
    if (!accounts || accounts.length === 0) {
      try {
        accounts = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error("Connection timeout")), 3000);
          window.ethereum.request({ method: 'eth_requestAccounts', params: [] })
            .then(result => { clearTimeout(timeoutId); resolve(result); })
            .catch(error => { clearTimeout(timeoutId); reject(error); });
        });
      } catch (requestError) {
         // Ignore request error, proceed to next method
      }
    }
    
    // If we still don't have accounts, try one last method: eth_accounts
    if (!accounts || accounts.length === 0) {
      try {
        accounts = await window.ethereum.request({ method: 'eth_accounts', params: [] });
      } catch (accountsError) {
        // Ignore accounts error
      }
    }
    
    // Check if we got any accounts
    if (accounts && accounts.length > 0) {
      return { success: true, account: accounts[0] };
    }
    
    // If we get here, all methods failed
    return { 
      success: false, 
      error: 'Could not connect to MetaMask. Please check if MetaMask is unlocked and try again.'
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Unknown error connecting to wallet' 
    };
  }
};

// Modify the main connectWallet function to use the simple connection method
export const connectWallet = async () => {
  try {
    // Check basic MetaMask installation first
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    // First try the simple direct method
    const simpleResult = await simpleConnectWallet();
    if (simpleResult.success) return simpleResult;
    
    // Try the alternative method next
    const alternativeResult = await connectWalletAlternative();
    if (alternativeResult.success) return alternativeResult;
    
    // If all methods failed, return the error from the simple method
    return simpleResult;
    
  } catch (error) {
    // Provide more helpful error messages
    let errorMessage = error.message || 'An error occurred connecting to MetaMask';
    if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
      errorMessage = 'Connection rejected. Please approve the MetaMask connection request.';
    } else if (error.code === -32002) {
      errorMessage = 'MetaMask connection request already pending. Please open MetaMask extension.';
    } else if (errorMessage.includes('timed out')) {
      errorMessage = 'Connection timed out. Please try again or restart your browser.';
    }
    return { success: false, error: errorMessage };
  }
};

// Disconnect wallet - Improved implementation
export const disconnectWallet = async () => {
  try {
    // Use newer MetaMask method to disconnect all connected sites
    if (window.ethereum && window.ethereum.request) {
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }]
      });
      console.log('Successfully revoked site permissions from MetaMask');
    }
    
    // Additionally, we emit a custom event to notify our app
    window.dispatchEvent(new CustomEvent('wallet_disconnected'));
    
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return { success: false, error: error.message };
  }
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
    
    const networkName = SUPERSEED_NETWORK.chainName;
    console.log(`Adding ${networkName} with config:`, SUPERSEED_NETWORK);
    
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
    
    const networkName = SUPERSEED_NETWORK.chainName;
    console.log(`Checking if ${networkName} is added...`);
    const isAdded = await isSuperSeedNetworkAdded();
    console.log(`${networkName} already added:`, isAdded);
    
    if (!isAdded) {
      console.log(`Adding ${networkName} to MetaMask...`);
      const addResult = await addSuperSeedNetwork();
      if (!addResult.success) {
        throw new Error(addResult.error);
      }
      console.log(`${networkName} added successfully`);
    }
    
    console.log(`Switching to ${networkName}...`);
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SUPERSEED_NETWORK.chainId }]
    });
    console.log(`Successfully switched to ${networkName}`);
    
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

// Check initial wallet connection status
export const checkInitialWalletConnection = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      return { connected: false, address: null };
    }
    
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts',
      params: []
    });
    
    if (accounts && accounts.length > 0) {
      console.log('Found existing wallet connection:', accounts[0]);
      return { connected: true, address: accounts[0] };
    } else {
      console.log('No wallet connected on initial check');
      return { connected: false, address: null };
    }
  } catch (error) {
    console.error('Error checking initial wallet connection:', error);
    return { connected: false, address: null };
  }
}; 