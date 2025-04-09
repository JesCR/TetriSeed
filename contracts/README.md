# TetriSeed Game Smart Contracts

![TetriSeed Game](https://raw.githubusercontent.com/JesCR/TetriSeed/refs/heads/main/src/assets/images/logo_text.png)

This repository contains the smart contracts for the TetriSeed competitive game mode, which handle entry fees, prize pools, and reward distribution for the TetriSeed game.

## Table of Contents

- [Overview](#overview)
- [Contract Architecture](#contract-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
  - [Compiling Contracts](#compiling-contracts)
  - [Running Tests](#running-tests)
  - [Code Coverage](#code-coverage)
- [Deployment](#deployment)
  - [Local Deployment](#local-deployment)
  - [SuperSeed Sepolia Deployment](#superseed-sepolia-deployment)
  - [Mainnet Deployment](#mainnet-deployment)
- [Contract Documentation](#contract-documentation)
  - [TetriSeedGame.sol](#tetriseedgamesol)
  - [MockSUPR.sol](#mocksuprsol)
- [Contract Functions](#contract-functions)
  - [Core Game Functions](#core-game-functions)
  - [Administrative Functions](#administrative-functions)
  - [View Functions](#view-functions)
- [Events](#events)
- [ABI and Integration](#abi-and-integration)
- [Security Features](#security-features)
- [Security Audit Results](#security-audit-results)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The TetriSeed Game smart contracts implement a competitive gaming platform with the following features:

- Players pay an entry fee in ETH to participate in competitive games
- Entry fees accumulate in a weekly prize pool (Monday-Sunday)
- At the end of each week (season), prizes are distributed to the top 5 players
- The contract owner can adjust entry fees and prize distribution percentages
- Players can make additional deposits to contribute to the prize pool
- All actions emit events for transparency and off-chain tracking

## Contract Architecture

The smart contract system consists of the following main components:

1. **TetriSeedGame.sol** - The main contract that manages:
   - Game entry and fees
   - Prize pool accumulation
   - Season management
   - Prize distribution
   - Administrative functions

2. **MockSUPR.sol** - A simple ERC20 token implementation for testing

3. **External Dependencies**:
   - OpenZeppelin's `Ownable` - For access control
   - OpenZeppelin's `ReentrancyGuard` - For protection against reentrancy attacks

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- [npm](https://www.npmjs.com/) (v6.0.0 or higher)
- [Hardhat](https://hardhat.org/)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)
- [MetaMask](https://metamask.io/) or another Ethereum wallet for testing and deployment

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/tetriseed-game.git
   cd tetriseed-game/contracts
   ```

2. Install the dependencies:
```bash
npm install
```

3. Create your environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration:
   ```
   # Required for deployment
   PRIVATE_KEY=your_wallet_private_key_here

   # Optional: existing SUPR token address (if available)
   SUPR_TOKEN_ADDRESS=existing_supr_token_address
   ```

## Development

### Compiling Contracts

Compile the smart contracts with:

```bash
npx hardhat compile
```

Or use the npm script:

```bash
npm run compile
```

### Running Tests

Run the test suite to ensure everything is working correctly:

```bash
npx hardhat test
```

Or use the npm script:

```bash
npm test
```

This will run the full test suite that verifies all contract functionality, including:
- Game entry and fee collection
- Prize distribution logic
- Season management
- Access control validation
- Edge cases and error handling

### Code Coverage

Generate a code coverage report to see how well the tests cover the contract code:

```bash
npx hardhat coverage
```

Or use the npm script:

```bash
npm run coverage
```

## Deployment

### Local Deployment

To deploy to a local development network:

1. Start a local Hardhat node:
   ```bash
npx hardhat node
   ```

2. In a separate terminal, deploy the contracts:
   ```bash
npx hardhat run scripts/deploy.js --network localhost
```

   Or use the npm script:
   ```bash
   npm run deploy:local
   ```

### SuperSeed Sepolia Deployment

To deploy to the SuperSeed Sepolia testnet:

1. Ensure your `.env` file is configured with your private key
2. If you want to use an existing SUPR token, add its address to the `.env` file
3. Run the deployment script:
```bash
npx hardhat run scripts/deploy-superseed.js --network superseedSepolia
```

   Or use the npm script:
   ```bash
   npm run deploy:superseed
   ```

### Mainnet Deployment

For production deployment to Ethereum mainnet or other networks:

1. Ensure your `.env` file is configured with your private key
2. Update the `hardhat.config.js` file with the network configuration (if not already present)
3. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

> **Note**: Always ensure you have sufficient funds for deployment gas costs.

## Contract Documentation

### TetriSeedGame.sol

The main contract that manages the competitive gaming experience.

#### State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `entryFee` | `uint256` | Amount in ETH required to enter a game (default: 0.0001 ETH) |
| `prizeDistribution` | `uint8[5]` | Percentage distribution for top 5 winners (default: [50, 30, 10, 5, 5]) |
| `weeklyPrizePool` | `uint256` | Current accumulated prize pool in ETH |
| `seasonStartTime` | `uint256` | Timestamp when current season started |
| `SEASON_DURATION` | `uint256` | Duration of a season (7 days) |
| `currentSeason` | `uint256` | Current season number |
| `playerBalances` | `mapping(address => uint256)` | ETH balances deposited by players |

#### Constructor

The constructor initializes the contract with default values:
- Sets entry fee to 0.0001 ETH
- Sets prize distribution to 50%, 30%, 10%, 5%, 5%
- Initializes the first season

```solidity
constructor()
```

### MockSUPR.sol

A simple ERC20 token implementation for testing purposes.

```solidity
constructor(string memory name, string memory symbol) ERC20(name, symbol)
```

The constructor creates a new token with the specified name and symbol.

## Contract Functions

### Core Game Functions

#### Enter Game

```solidity
function enterGame() external payable nonReentrant
```

Allows a player to enter the competitive game mode by paying the entry fee in ETH.

**Parameters**: None

**Returns**: None

**Events**:
- `EthDeposited(address player, uint256 amount, uint256 timestamp)`
- `GameEntered(address player, uint256 fee, uint256 timestamp)`

**Requirements**:
- If using player's balance, they must have sufficient ETH deposited
- If sending ETH directly, the transaction must include at least the entry fee amount

**Example**:
```javascript
// Using ethers.js
const tx = await tetriSeedGameContract.enterGame({ value: ethers.utils.parseEther("0.0001") });
await tx.wait();
```

#### Deposit ETH

```solidity
function depositEth() external payable nonReentrant
```

Allows a player to deposit additional ETH to their balance.

**Parameters**: None

**Returns**: None

**Events**:
- `EthDeposited(address player, uint256 amount, uint256 timestamp)`

**Requirements**:
- The transaction must include ETH (amount > 0)

**Example**:
```javascript
// Using ethers.js
const tx = await tetriSeedGameContract.depositEth({ value: ethers.utils.parseEther("0.01") });
await tx.wait();
```

#### End Season

```solidity
function endSeason(address[5] calldata winners) external onlyOwner nonReentrant
```

Ends the current season and distributes prizes to the top 5 winners.

**Parameters**:
- `winners`: Array of 5 winner addresses in order of ranking (1st to 5th place)

**Returns**: None

**Events**:
- `EthWithdrawn(address recipient, uint256 amount, uint256 timestamp)` (for each winner)
- `PrizeAwarded(address winner, uint256 amount, uint8 rank, uint256 season)` (for each winner)
- `SeasonEnded(uint256 season, uint256 totalPrize)`

**Requirements**:
- Only contract owner can call this function
- Prize pool must be greater than 0
- Winner addresses must be valid and not duplicated

**Example**:
```javascript
// Using ethers.js
const winners = [
  "0x1234...", // 1st place
  "0x2345...", // 2nd place
  "0x3456...", // 3rd place
  "0x4567...", // 4th place
  "0x5678..."  // 5th place
];
const tx = await tetriSeedGameContract.endSeason(winners);
await tx.wait();
```

### Administrative Functions

#### Set Entry Fee

```solidity
function setEntryFee(uint256 newFee) external onlyOwner
```

Updates the entry fee required to play the competitive game mode.

**Parameters**:
- `newFee`: New entry fee in ETH

**Returns**: None

**Events**:
- `EntryFeeUpdated(uint256 oldFee, uint256 newFee)`

**Requirements**:
- Only contract owner can call this function
- New fee must be greater than 0

**Example**:
```javascript
// Using ethers.js
const tx = await tetriSeedGameContract.setEntryFee(ethers.utils.parseEther("0.0002"));
await tx.wait();
```

#### Set Prize Distribution

```solidity
function setDistribution(uint8[5] calldata newPercentages) external onlyOwner
```

Updates the percentage distribution for the top 5 winners.

**Parameters**:
- `newPercentages`: Array of 5 percentages for each rank (must sum to 100)

**Returns**: None

**Events**:
- `DistributionUpdated(uint8[5] oldDistribution, uint8[5] newDistribution)`

**Requirements**:
- Only contract owner can call this function
- Percentages must sum to exactly 100

**Example**:
```javascript
// Using ethers.js
const newDistribution = [45, 25, 15, 10, 5]; // Must sum to 100
const tx = await tetriSeedGameContract.setDistribution(newDistribution);
await tx.wait();
```

#### Owner Withdraw

```solidity
function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant
```

Allows the contract owner to withdraw ETH from the prize pool.

**Parameters**:
- `amount`: Amount of ETH to withdraw

**Returns**: None

**Events**:
- `EthWithdrawn(address owner, uint256 amount, uint256 timestamp)`
- `OwnerWithdrawal(uint256 amount, uint256 timestamp)`

**Requirements**:
- Only contract owner can call this function
- Amount must be less than or equal to available prize pool

**Example**:
```javascript
// Using ethers.js
const tx = await tetriSeedGameContract.ownerWithdraw(ethers.utils.parseEther("0.1"));
await tx.wait();
```

### View Functions

#### Get Current Season End Time

```solidity
function getCurrentSeasonEndTime() external view returns (uint256)
```

Returns the timestamp when the current season will end.

**Parameters**: None

**Returns**: 
- `uint256`: Timestamp of season end time

**Example**:
```javascript
// Using ethers.js
const endTime = await tetriSeedGameContract.getCurrentSeasonEndTime();
const endDate = new Date(endTime.toNumber() * 1000);
console.log(`Season ends on: ${endDate.toLocaleString()}`);
```

#### Get Prize Distribution

```solidity
function getPrizeDistribution() external view returns (uint8[5] memory)
```

Returns the current prize distribution percentages for the top 5 winners.

**Parameters**: None

**Returns**:
- `uint8[5]`: Array of percentages for each rank

**Example**:
```javascript
// Using ethers.js
const distribution = await tetriSeedGameContract.getPrizeDistribution();
console.log(`1st place: ${distribution[0]}%`);
console.log(`2nd place: ${distribution[1]}%`);
console.log(`3rd place: ${distribution[2]}%`);
console.log(`4th place: ${distribution[3]}%`);
console.log(`5th place: ${distribution[4]}%`);
```

## Events

The TetriSeedGame contract emits the following events for tracking and UI updates:

| Event | Parameters | Description |
|-------|------------|-------------|
| `EthDeposited` | `address indexed player, uint256 amount, uint256 timestamp` | Emitted when ETH is deposited to the contract |
| `EthWithdrawn` | `address indexed recipient, uint256 amount, uint256 timestamp` | Emitted when ETH is withdrawn from the contract |
| `GameEntered` | `address indexed player, uint256 fee, uint256 timestamp` | Emitted when a player enters a game |
| `PrizesDistributed` | `address[5] winners, uint256[5] amounts, uint256 totalDistributed` | Emitted when prizes are distributed |
| `OwnerWithdrawal` | `uint256 amount, uint256 timestamp` | Emitted when the owner withdraws ETH |
| `EntryFeeUpdated` | `uint256 oldFee, uint256 newFee` | Emitted when the entry fee is updated |
| `DistributionUpdated` | `uint8[5] oldDistribution, uint8[5] newDistribution` | Emitted when prize distribution is updated |
| `PrizeAwarded` | `address indexed winner, uint256 amount, uint8 rank, uint256 indexed season` | Emitted for each winner when a prize is awarded |
| `SeasonEnded` | `uint256 indexed season, uint256 totalPrize` | Emitted when a season ends |

## ABI and Integration

### Accessing the ABI

After compilation, the ABI (Application Binary Interface) will be available in the `artifacts` directory:

```
artifacts/contracts/TetriSeedGame.sol/TetriSeedGame.json
```

You can extract the ABI for frontend integration:

```javascript
const contractArtifact = require('./artifacts/contracts/TetriSeedGame.sol/TetriSeedGame.json');
const contractABI = contractArtifact.abi;
```

### Frontend Integration Example

Here's a simple example of integrating the contract with a frontend using ethers.js:

```javascript
import { ethers } from 'ethers';
import TetriSeedGameABI from './TetriSeedGame.json';

// Contract address (from deployment)
const contractAddress = '0xd9b4190777287eAD1473A5EE44aA2a6aAE3b7b42';

// Connect to provider (MetaMask)
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Create contract instance
const tetriSeedGame = new ethers.Contract(contractAddress, TetriSeedGameABI.abi, signer);

// Get contract data
async function getContractData() {
  const entryFee = await tetriSeedGame.entryFee();
  const prizePool = await tetriSeedGame.weeklyPrizePool();
  const currentSeason = await tetriSeedGame.currentSeason();
  const seasonEndTime = await tetriSeedGame.getCurrentSeasonEndTime();
  
  return {
    entryFee: ethers.utils.formatEther(entryFee),
    prizePool: ethers.utils.formatEther(prizePool),
    currentSeason: currentSeason.toString(),
    seasonEndTime: new Date(seasonEndTime.toNumber() * 1000).toLocaleString()
  };
}

// Enter a game
async function enterGame() {
  const fee = await tetriSeedGame.entryFee();
  const tx = await tetriSeedGame.enterGame({ value: fee });
  await tx.wait();
  return tx.hash;
}
```

## Security Features

The TetriSeedGame contract incorporates several security features:

1. **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks.

2. **Access Control**: Administrative functions are protected with OpenZeppelin's `Ownable` modifier.

3. **Input Validation**: Extensive validation for all inputs including:
   - Duplicate winner address detection
   - Zero address checks
   - Prize distribution percentage validation

4. **Integer Overflow Protection**: Uses Solidity 0.8's built-in overflow checking.

5. **Secure ETH Handling**: Careful management of ETH transfers with proper error handling.

6. **Event Emission**: All state changes emit events for transparency and auditability.

## Security Audit Results

A comprehensive security audit of the TetriSeedGame contract has been conducted, focusing on security vulnerabilities, authorization controls, and trust assumptions. The key findings are:

### Strengths

- **Reentrancy Protection**: The contract properly implements OpenZeppelin's `nonReentrant` modifier on all functions that involve ETH transfers.
- **Authorization Controls**: Administrative functions are secured with the `onlyOwner` modifier, ensuring only the contract owner can execute them.
- **Input Validation**: The contract includes thorough checks for edge cases such as duplicate winner addresses and zero addresses.
- **Arithmetic Safety**: Solidity 0.8's built-in overflow protection is utilized throughout the contract.
- **Event Transparency**: Events are emitted for all significant state changes, providing transparency and off-chain tracking capabilities.

### Trust Assumptions

The contract includes the following trust assumptions:

1. **Winner Selection**: The primary trust assumption is that the contract owner (admin) will provide legitimate winners, as there is no on-chain verification of game results.
2. **Fund Management**: By design, players cannot withdraw their deposited ETH. ETH remains in the contract for prize distribution or future game entries.

### Recommendations for Trust Minimization

The following recommendations could further enhance the security and trustlessness of the system:

1. **Multi-signature Ownership**: Consider implementing a multi-sig wallet as the contract owner to require multiple parties to agree on winner selection.
2. **Time-locked Operations**: Add a timelock to critical administrative functions to allow community review of proposed changes.
3. **On-chain Verification**: Long-term, develop mechanisms for on-chain verification of game results.
4. **Emergency Controls**: Implement a circuit breaker/pausable pattern to halt the contract in emergency situations.
5. **Automated Season Management**: Use Chainlink Keepers or similar services to automate season transitions.

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Ensure your wallet has enough ETH to cover the gas costs for contract deployment and interactions.

   **Solution**: Fund your wallet with additional ETH before attempting deployment or interaction.

2. **Network Configuration**: Incorrect RPC URL or chain ID in the Hardhat configuration.

   **Solution**: Verify network settings in `hardhat.config.js` match the target network.

3. **Contract Verification**: Failed contract verification on block explorers.

   **Solution**: Use the correct compiler version and optimization settings when verifying contracts.

4. **Prize Distribution Failure**: Transaction reverts when trying to end a season.

   **Solution**: Ensure all winner addresses are valid, non-zero, and non-duplicate.

5. **Private Key Security**: Exposing private key in code or GitHub.

   **Solution**: Always use environment variables for private keys and include `.env` in `.gitignore`.

### Debugging

For detailed debugging, use Hardhat's built-in debugging capabilities:

```bash
npx hardhat console --network <network>
```

This provides an interactive JavaScript console where you can interact with contracts and debug issues.

## Contributing

Contributions to the TetriSeed Game smart contracts are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and passes all tests.

## License

The TetriSeed Game smart contracts are licensed under the MIT License. See the LICENSE file for details. 