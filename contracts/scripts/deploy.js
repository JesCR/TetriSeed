// We require the Hardhat Runtime Environment explicitly here. 
const hre = require("hardhat");

async function main() {
  console.log("Deploying the TetriSeed Game contracts...");

  // Deploy MockSUPR token
  const MockSUPR = await hre.ethers.getContractFactory("MockSUPR");
  const mockSupr = await MockSUPR.deploy();
  await mockSupr.deploymentTransaction().wait();

  console.log("MockSUPR deployed to:", mockSupr.target);

  // Deploy TetriSeedGame with the MockSUPR token address
  const TetriSeedGame = await hre.ethers.getContractFactory("TetriSeedGame");
  const tetriSeedGame = await TetriSeedGame.deploy(mockSupr.target);
  await tetriSeedGame.deploymentTransaction().wait();

  console.log("TetriSeedGame deployed to:", tetriSeedGame.target);

  console.log("Deployment completed successfully!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 