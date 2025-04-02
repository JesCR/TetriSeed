// We require the Hardhat Runtime Environment explicitly here.
const hre = require("hardhat");

async function main() {
  console.log("Deploying the TetriSeedGame contract to SuperSeed Sepolia testnet...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // This is a placeholder for the real $SUPR token address on SuperSeed Sepolia
  // Replace this with the actual token address when available
  // For testing, you can deploy the MockSUPR token first
  const suprTokenAddress = process.env.SUPR_TOKEN_ADDRESS;
  
  if (!suprTokenAddress) {
    console.log("Deploying MockSUPR token first...");
    const MockSUPR = await hre.ethers.getContractFactory("MockSUPR");
    const mockSupr = await MockSUPR.deploy();
    await mockSupr.deploymentTransaction().wait();
    console.log("MockSUPR deployed to:", mockSupr.target);
    
    // Use the MockSUPR address for the TetriSeedGame deployment
    const suprAddress = mockSupr.target;
    
    // Deploy TetriSeedGame
    const TetriSeedGame = await hre.ethers.getContractFactory("TetriSeedGame");
    console.log("Deploying TetriSeedGame...");
    const tetriSeedGame = await TetriSeedGame.deploy(suprAddress);
    await tetriSeedGame.deploymentTransaction().wait();
    
    console.log("TetriSeedGame deployed to:", tetriSeedGame.target);
    console.log("Using MockSUPR token:", suprAddress);
  } else {
    // Deploy using the provided $SUPR token address
    console.log("Using existing $SUPR token address:", suprTokenAddress);
    
    // Deploy TetriSeedGame
    const TetriSeedGame = await hre.ethers.getContractFactory("TetriSeedGame");
    console.log("Deploying TetriSeedGame...");
    const tetriSeedGame = await TetriSeedGame.deploy(suprTokenAddress);
    await tetriSeedGame.deploymentTransaction().wait();
    
    console.log("TetriSeedGame deployed to:", tetriSeedGame.target);
  }

  console.log("Deployment to SuperSeed Sepolia completed successfully!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 