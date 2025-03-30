// Web3 utilities for competitive mode
import { ethers } from 'ethers';

// Network configuration for SuperSeed
const SUPERSEED_NETWORK = {
  chainId: '0xD026', // 53302 in hex
  chainName: 'Superseed Sepolia Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.superseed.xyz'],
  blockExplorerUrls: ['https://sepolia-explorer.superseed.xyz']
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

// Get MetaMask download link
export const getMetaMaskDownloadLink = () => {
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

// Check if SuperSeed network is added to MetaMask
export const isSuperSeedNetworkAdded = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      return false;
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId === SUPERSEED_NETWORK.chainId;
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
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [SUPERSEED_NETWORK]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding network:', error);
    return { success: false, error: error.message };
  }
};

// Switch to SuperSeed network
export const switchToSuperSeedNetwork = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    const isAdded = await isSuperSeedNetworkAdded();
    
    if (!isAdded) {
      const addResult = await addSuperSeedNetwork();
      if (!addResult.success) {
        throw new Error(addResult.error);
      }
    }
    
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SUPERSEED_NETWORK.chainId }]
    });
    
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
    
    // Mock payment - in real implementation this would be a contract call
    console.log(`Mocked payment of 1 $SUPR from ${account}`);
    
    // Simulate a delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, txHash: `mock_tx_${Date.now()}` };
  } catch (error) {
    console.error('Error in mock payment:', error);
    return { success: false, error: error.message };
  }
}; 