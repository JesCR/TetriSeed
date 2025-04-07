// Contract utilities for competitive mode
import { ethers } from 'ethers';

// TetriSeedGame contract address on SuperSeed Sepolia testnet
export const TETRISEED_CONTRACT = {
  testnet: '0xd9b4190777287eAD1473A5EE44aA2a6aAE3b7b42', // Our deployed contract address
  mainnet: '' // To be added when mainnet contract is deployed
};

// TetriSeedGame ABI - minimal set of functions we need
const TETRISEED_ABI = [
  // Read functions
  {
    "inputs": [],
    "name": "entryFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "weeklyPrizePool",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentSeasonEndTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPrizeDistribution",
    "outputs": [{ "internalType": "uint8[5]", "name": "", "type": "uint8[5]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentSeason",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    "inputs": [],
    "name": "enterGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositEth",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Get the active network type (testnet/mainnet)
export const getActiveNetwork = () => {
  // Default to testnet
  return 'testnet';
};

// Get contract for the active network
export const getContractAddress = () => {
  const networkType = getActiveNetwork();
  return TETRISEED_CONTRACT[networkType];
};

// Create a contract instance
export const getContractInstance = (provider) => {
  const contractAddress = getContractAddress();
  return new ethers.Contract(contractAddress, TETRISEED_ABI, provider);
};

// Get entry fee from contract
export const getEntryFee = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = getContractInstance(provider);
    const entryFee = await contract.entryFee();
    return { success: true, entryFee: ethers.utils.formatEther(entryFee) };
  } catch (error) {
    console.error('Error getting entry fee:', error);
    return { success: false, error: error.message };
  }
};

// Get prize pool from contract
export const getPrizePool = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = getContractInstance(provider);
    const prizePool = await contract.weeklyPrizePool();
    return { success: true, prizePool: ethers.utils.formatEther(prizePool) };
  } catch (error) {
    console.error('Error getting prize pool:', error);
    return { success: false, error: error.message };
  }
};

// Get season end time from contract
export const getSeasonEndTime = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = getContractInstance(provider);
    const endTime = await contract.getCurrentSeasonEndTime();
    return { success: true, endTime: endTime.toNumber() };
  } catch (error) {
    console.error('Error getting season end time:', error);
    return { success: false, error: error.message };
  }
};

// Get prize distribution from contract
export const getPrizeDistribution = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = getContractInstance(provider);
    const distribution = await contract.getPrizeDistribution();
    // Convert from array of BigNumber to array of numbers
    const percentages = distribution.map(value => Number(value));
    return { success: true, distribution: percentages };
  } catch (error) {
    console.error('Error getting prize distribution:', error);
    return { success: false, error: error.message };
  }
};

// Enter game - pay entry fee
export const enterGame = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = getContractInstance(signer);
    
    // Get entry fee from contract
    const entryFeeResult = await getEntryFee();
    if (!entryFeeResult.success) {
      throw new Error(entryFeeResult.error);
    }
    
    // Convert entry fee to wei
    const entryFeeWei = ethers.utils.parseEther(entryFeeResult.entryFee);
    
    // Call enterGame function with entry fee
    const tx = await contract.enterGame({ value: entryFeeWei });
    await tx.wait();
    
    // Get updated prize pool after entry
    const prizePoolResult = await getPrizePool();
    const prizePool = prizePoolResult.success ? prizePoolResult.prizePool : '0';
    
    return { 
      success: true, 
      txHash: tx.hash,
      potSize: prizePool,
      playerCount: 0 // We don't have this from the contract, would require tracking off-chain
    };
  } catch (error) {
    console.error('Error entering game:', error);
    return { success: false, error: error.message };
  }
};

// Deposit additional ETH to prize pool
export const depositEth = async (amount) => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = getContractInstance(signer);
    
    // Convert amount to wei
    const amountWei = ethers.utils.parseEther(amount.toString());
    
    // Call depositEth function with amount
    const tx = await contract.depositEth({ value: amountWei });
    await tx.wait();
    
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error depositing ETH:', error);
    return { success: false, error: error.message };
  }
}; 