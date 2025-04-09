import { ethers } from "ethers";
import Web3Modal from "web3modal";
import TetriSeedGameContract from "../contracts/TetriSeedGame.json";

const CONTRACT_ADDRESS = TetriSeedGameContract.address;
const CONTRACT_ABI = TetriSeedGameContract.abi;

// Initialize web3modal for connecting to MetaMask or other wallets
const getWeb3Modal = () => {
  const web3Modal = new Web3Modal({
    network: "superseedSepolia",
    cacheProvider: true,
    providerOptions: {},
  });
  return web3Modal;
};

// Connect wallet and get provider, signer
export const connectWallet = async () => {
  try {
    const web3Modal = getWeb3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.BrowserProvider(connection);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return { provider, signer, address };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
};

// Disconnect wallet
export const disconnectWallet = async () => {
  const web3Modal = getWeb3Modal();
  if (web3Modal.cachedProvider) {
    web3Modal.clearCachedProvider();
    window.location.reload();
  }
};

// Get contract instance
export const getContract = async (signer) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    return contract;
  } catch (error) {
    console.error("Error getting contract:", error);
    throw error;
  }
};

// Check if address is the contract owner
export const isContractOwner = async (address, contract) => {
  try {
    const owner = await contract.owner();
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Error checking contract owner:", error);
    return false;
  }
};

// Helper to format Wei to ETH
export const formatEther = (wei) => {
  return ethers.formatEther(wei);
};

// Helper to parse ETH to Wei
export const parseEther = (eth) => {
  return ethers.parseEther(eth);
}; 