// We require the Hardhat Runtime Environment explicitly here.
const hre = require("hardhat");

async function main() {
  console.log("Deploying the TetriSeedGame contract to SuperSeed Sepolia testnet...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy TetriSeedGame
  const TetriSeedGame = await hre.ethers.getContractFactory("TetriSeedGame");
  console.log("Deploying TetriSeedGame...");
  const tetriSeedGame = await TetriSeedGame.deploy();
  await tetriSeedGame.deploymentTransaction().wait();
  
  console.log("TetriSeedGame deployed to:", tetriSeedGame.target);
  console.log("Deployment to SuperSeed Sepolia completed successfully!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 