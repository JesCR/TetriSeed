// Web3 utilities for competitive mode
import { ethers } from 'ethers';
import { getApiUrl } from './apiConfig';
import { enterGame } from './contractUtils';

// Explicitly isolate MetaMask provider at startup
export const isolateMetaMaskAtStartup = () => {
  // Save original Ethereum object state
  const originalEthereum = window.ethereum;
  const originalProviders = window.ethereum?.providers;
  
  try {
    // Find MetaMask provider using same pattern as our standard function
    let mmProvider = null;
    
    // First check for providers array
    if (window.ethereum?.providers) {
      mmProvider = window.ethereum.providers.find(p => p.isMetaMask);
      if (mmProvider) {
        console.log('Startup: Found MetaMask in providers array');
      }
    }
    
    // If not found in providers array, check if window.ethereum is MetaMask
    if (!mmProvider && window.ethereum?.isMetaMask) {
      mmProvider = window.ethereum;
      console.log('Startup: window.ethereum is MetaMask');
    }
    
    if (!mmProvider) {
      console.warn('Startup: MetaMask provider not detected');
      return false;
    }
    
    // Override window.ethereum to be specifically the MetaMask provider
    console.log('Startup: Isolating MetaMask provider');
    
    // Clone the provider to avoid reference issues
    const providerClone = Object.create(Object.getPrototypeOf(mmProvider));
    Object.assign(providerClone, mmProvider);
    
    // Don't try to modify the providers property - just use the provider as is
    window.ethereum = providerClone;
    
    console.log('Startup: MetaMask successfully isolated');
    
    // Keep MetaMask isolated for a few seconds to ensure initial
    // operations complete with the isolated provider
    setTimeout(() => {
      if (originalEthereum === window.ethereum) return; // No change needed
      
      console.log('Startup: Restoring original Ethereum configuration');
      window.ethereum = originalEthereum;
      
      // We don't need to restore providers as it's part of the original object
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('Error isolating MetaMask at startup:', error);
    
    // Restore original state in case of error
    if (originalEthereum !== window.ethereum) {
      window.ethereum = originalEthereum;
    }
    
    return false;
  }
};

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

// Helper function to find the specific MetaMask provider instance
const findMetaMaskProvider = () => {
  // Check for multiple providers (EIP-1193 compliant wallets)
  if (window.ethereum?.providers) {
    // Find MetaMask's provider among multiple injected providers
    // This is the most reliable way to get MetaMask when multiple wallets are installed
    const mmProvider = window.ethereum.providers.find(p => p.isMetaMask);
    if (mmProvider) {
      console.log('Found MetaMask provider in providers array');
      return mmProvider;
    }
  }
  
  // Fallback to window.ethereum if it's MetaMask (single provider scenario)
  if (window.ethereum && window.ethereum.isMetaMask) {
    console.log('Using window.ethereum as MetaMask provider (single provider)');
    return window.ethereum;
  }
  
  console.warn("MetaMask provider not found - neither in providers array nor as window.ethereum");
  return null;
};

// Get the specific MetaMask provider (exported for potential direct use)
export const getMetaMaskProvider = () => {
  return findMetaMaskProvider();
};

// Check if MetaMask is installed (using the finder function)
export const isMetaMaskInstalled = () => {
  const provider = findMetaMaskProvider();
  
  // Handle mobile detection separately
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
     // On mobile, the provider might be injected directly or via the array.
     // Assume if *any* ethereum provider exists, it's usable (MetaMask app browser)
     return !!provider || typeof window.ethereum !== 'undefined';
  }

  return !!provider; // On desktop, rely solely on finding the specific MM provider object
};

// Listener for account changes - call this when the app initializes
export const setupWalletListeners = (onAccountsChanged = null, onDisconnect = null) => {
  const provider = getMetaMaskProvider();
  // Ensure METAMASK provider exists before setting up listeners
  if (provider) {
    // Handle account changes
    provider.on('accountsChanged', (accounts) => {
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
    provider.on('chainChanged', (chainId) => {
      console.log('MetaMask chain changed:', chainId);
      
      // Don't reload the page and don't try to switch networks automatically
      // Just dispatch an event so components can react appropriately
      window.dispatchEvent(new CustomEvent('network_changed', {
        detail: { 
          chainId,
          isSuperSeedNetwork: chainId.toLowerCase() === SUPERSEED_NETWORK.chainId.toLowerCase()
        }
      }));
    });

    // Handle disconnect
    provider.on('disconnect', (error) => {
      console.log('MetaMask disconnected (disconnect event):', error);
      if (onDisconnect && typeof onDisconnect === 'function') {
        onDisconnect();
      }
    });

    // Handle connection
    provider.on('connect', (connectInfo) => {
      console.log('MetaMask connected:', connectInfo);
    });

    // Set up a periodic connection check every 5 seconds
    const connectionCheckInterval = setInterval(async () => {
      try {
        // Get the provider again in case it changed
        const currentProvider = getMetaMaskProvider();
        if (!currentProvider) {
          console.log('MetaMask provider no longer available');
          if (onDisconnect && typeof onDisconnect === 'function') {
            onDisconnect();
          }
          clearInterval(connectionCheckInterval);
          return;
        }

        // Try to get accounts using the specific provider
        const accounts = await currentProvider.request({ 
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
          const accounts = await currentProvider.request({ 
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
      // Try removing listeners from the specific provider if it still exists
      const currentProvider = getMetaMaskProvider();
      if (currentProvider && typeof currentProvider.removeAllListeners === 'function') {
        currentProvider.removeAllListeners('accountsChanged');
        currentProvider.removeAllListeners('chainChanged');
        currentProvider.removeAllListeners('disconnect');
        currentProvider.removeAllListeners('connect');
      } else if (window.ethereum && typeof window.ethereum.removeAllListeners === 'function') {
        // Fallback attempt on window.ethereum if specific provider gone/unsupported
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('disconnect');
        window.ethereum.removeAllListeners('connect');
      }
    };
  }
  
  // If no MetaMask provider found, return a no-op cleanup function
  return () => {};
};

// Get wallet balance (ETH)
export const getWalletBalance = async (address) => {
  try {
    const provider = getMetaMaskProvider();
    if (!provider || !address) {
      return { success: false, error: 'MetaMask provider not found or no address' };
    }
    
    const ethersProvider = new ethers.providers.Web3Provider(provider); // Use specific provider
    const balance = await ethersProvider.getBalance(address);
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
    const provider = getMetaMaskProvider();
    if (!provider || !address) {
      return { success: false, error: 'MetaMask provider not found or no address' };
    }
    
    const ethersProvider = new ethers.providers.Web3Provider(provider); // Use specific provider
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
    
    const tokenContract = new ethers.Contract(usdcAddress, minABI, ethersProvider);
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

// Simple direct connection attempt
export const simpleConnectWallet = async () => {
  try {
    // First check if we have the specific MetaMask provider object
    const provider = getMetaMaskProvider();
    if (!provider) {
      return { success: false, error: 'MetaMask provider not detected' };
    }
    
    console.log('Using explicit MetaMask provider for connection attempt');
    
    // Try the most direct approach possible using the specific provider
    let accounts = [];
    
    // Direct eth_requestAccounts call - most reliable method
    try {
      accounts = await provider.request({ 
        method: 'eth_requestAccounts', 
        params: [] 
      });
      console.log('Successfully connected using eth_requestAccounts');
    } catch (requestError) {
      console.error('Error in eth_requestAccounts:', requestError);
      
      // Fallback to enable() if eth_requestAccounts fails
      try {
        if (typeof provider.enable === 'function') {
          accounts = await provider.enable();
          console.log('Successfully connected using enable()');
        }
      } catch (enableError) {
        console.error('Error in enable():', enableError);
      }
    }
    
    // Check if we got any accounts from the specific provider
    if (accounts && accounts.length > 0) {
      return { success: true, account: accounts[0] };
    }
    
    // If we get here, all methods failed
    return { 
      success: false, 
      error: 'Could not connect to MetaMask. Please check if MetaMask is unlocked and try again.'
    };
    
  } catch (error) {
    console.error('Unexpected error in simpleConnectWallet:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error connecting to wallet' 
    };
  }
};

// Try alternative way to connect to MetaMask if the standard one fails
export const connectWalletAlternative = async () => {
  try {
    const provider = getMetaMaskProvider();
    // Check if MetaMask provider exists
    if (!provider) {
      throw new Error('MetaMask provider not found');
    }
    
    console.log('Using alternative connection method with explicit MetaMask provider');
    
    // Try to get provider directly using the specific provider instance
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    
    // Try requesting accounts first
    try {
      await provider.request({ method: 'eth_requestAccounts' });
    } catch (requestError) {
      console.warn('eth_requestAccounts failed in alternative method:', requestError.message);
    }
    
    // Request provider's signer (this often triggers the MetaMask popup)
    const signer = ethersProvider.getSigner();
    
    // Get the address which requires connection
    const address = await signer.getAddress();
    
    if (!address) {
      throw new Error('Could not get address from provider');
    }
    
    return { success: true, account: address };
  } catch (error) {
    console.error('Error in connectWalletAlternative:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to force MetaMask to be the selected provider
// This temporarily isolates the MetaMask provider during connection
const forceMetaMaskProviderSelection = async (operation) => {
  const originalEthereum = window.ethereum;
  const originalProviders = window.ethereum?.providers;

  try {
    // Stronger verification to ensure MetaMask provider is uniquely selected
    const mmProvider = window.ethereum?.providers?.find(p => p.isMetaMask) 
                       || (window.ethereum?.isMetaMask ? window.ethereum : null);

    if (!mmProvider) {
      throw new Error('MetaMask provider not found');
    }

    console.log('Force-isolating MetaMask provider for connection.');

    // Use the provider directly without attempting to modify its properties
    window.ethereum = mmProvider;
    
    // Don't try to delete properties that might be read-only
    // if (window.ethereum.providers) {
    //   delete window.ethereum.providers;
    // }

    // Slightly increased delay to ensure isolation takes effect fully
    await new Promise(resolve => setTimeout(resolve, 200));

    // Execute your operation explicitly on isolated MetaMask provider
    const result = await operation();

    return result;
  } finally {
    console.log('Restoring original Ethereum configuration.');
    
    if (window.ethereum !== originalEthereum) {
      window.ethereum = originalEthereum;
    }
    
    // We don't need to restore providers manually - it comes with the original object
  }
};

// Modified connectWallet function to use provider isolation
export const connectWallet = async () => {
  try {
    // Check basic MetaMask installation first
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed or provider not found');
    }
    
    // Use the force provider selection function to isolate MetaMask during connection
    return await forceMetaMaskProviderSelection(async () => {
      // First try the simple direct method
      const simpleResult = await simpleConnectWallet();
      if (simpleResult.success) return simpleResult;
      
      // Try the alternative method next
      const alternativeResult = await connectWalletAlternative();
      if (alternativeResult.success) return alternativeResult;
      
      // If all methods failed, return the error from the simple method
      return simpleResult;
    });
    
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
    // Use newer MetaMask method to disconnect - attempt on the specific provider first
    const provider = getMetaMaskProvider();
    let revoked = false;
    if (provider && provider.request) {
      try {
         await provider.request({
           method: "wallet_revokePermissions",
           params: [{ eth_accounts: {} }]
         });
         console.log('Successfully revoked site permissions from specific MetaMask provider');
         revoked = true;
      } catch (revokeError) {
         console.warn('Could not revoke permissions on specific provider:', revokeError.message);
      }
    }
    
    // Fallback or additional attempt on window.ethereum if the specific one failed or didn't exist
    if (!revoked && window.ethereum && window.ethereum.request && window.ethereum !== provider) {
       try {
         await window.ethereum.request({
           method: "wallet_revokePermissions",
           params: [{ eth_accounts: {} }]
         });
         console.log('Successfully revoked site permissions from window.ethereum');
         revoked = true;
       } catch (fallbackError) {
         console.warn('Could not revoke permissions on window.ethereum:', fallbackError.message);
       }
    }

    if (!revoked) {
      console.warn('Could not execute wallet_revokePermissions on any provider.');
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
    const provider = getMetaMaskProvider();
    if (!provider) {
      return false;
    }
    
    const chainId = await provider.request({ method: 'eth_chainId' }); // Use specific provider
    return chainId.toLowerCase() === SUPERSEED_NETWORK.chainId.toLowerCase();
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Add SuperSeed network to MetaMask
export const addSuperSeedNetwork = async () => {
  try {
    const provider = getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask provider not found');
    }
    
    const networkName = SUPERSEED_NETWORK.chainName;
    console.log(`Adding ${networkName} with config:`, SUPERSEED_NETWORK);
    
    await provider.request({ // Use specific provider
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
    const provider = getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask provider not found');
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
    
    // Check current chain ID before attempting to switch
    const currentChainId = await provider.request({ method: 'eth_chainId' });
    const isSuperSeedChain = currentChainId.toLowerCase() === SUPERSEED_NETWORK.chainId.toLowerCase();
    
    // Only switch if we're not already on the SuperSeed network
    if (!isSuperSeedChain) {
      console.log(`Switching to ${networkName}...`);
      await provider.request({ // Use specific provider
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SUPERSEED_NETWORK.chainId }]
      });
      console.log(`Successfully switched to ${networkName}`);
      
      // Don't dispatch any events here - chainChanged will handle notifying components
    } else {
      console.log(`Already on ${networkName}, no need to switch`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error switching network:', error);
    return { success: false, error: error.message };
  }
};

// Replace the mock payment function with real contract interaction
export const mockPayCompetitiveFee = async (account) => {
  try {
    if (!account) {
      throw new Error('No account connected');
    }
    
    // Log the payment attempt
    console.log(`Processing payment of 0.0001 ETH from ${account}`);
    
    // Use the real contract function
    const result = await enterGame();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process payment');
    }
    
    console.log('Payment successful:', result);
    
    return { 
      success: true, 
      txHash: result.txHash,
      potSize: result.potSize,
      playerCount: result.playerCount
    };
  } catch (error) {
    console.error('Error in payment:', error);
    return { success: false, error: error.message };
  }
};

// Check initial wallet connection status
export const checkInitialWalletConnection = async () => {
  try {
    // Get the specific MetaMask provider
    const provider = getMetaMaskProvider();
    if (!provider) {
      // isMetaMaskInstalled already handles the check, but double-check here
      console.log('Initial check: MetaMask provider not found.');
      return { connected: false, address: null };
    }
    
    // Request accounts using the specific provider
    const accounts = await provider.request({ 
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