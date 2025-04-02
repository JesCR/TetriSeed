# TetriSeed Game Smart Contracts

This directory contains the smart contracts for the TetriSeed competitive game mode. These contracts handle the entry fees, prize pools, and distribution of rewards for top players.

## Overview

The smart contracts implement the following features:

- Players pay an entry fee in $SUPR tokens to participate in competitive games
- Entry fees are collected into a weekly prize pool (Monday-Sunday)
- At the end of the week, prizes are distributed to the top 5 players according to configurable percentages
- The contract owner can adjust entry fees and prize distribution percentages
- Seasons run for a week, with end-of-season prize distribution
- Players can make additional deposits to contribute to the prize pool
- Full event logging for transparency and off-chain tracking

## Contract Structure

- `TetriSeedGame.sol`: The main contract that handles game entries and prize distribution
- `MockSUPR.sol`: A mock implementation of the $SUPR token for testing purposes

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Compile contracts:
```bash
npm run compile
# or
npx hardhat compile
```

3. Run tests:
```bash
npm test
# or
npx hardhat test
```

4. Deploy to a local network:
```bash
npm run deploy:local
# or
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

5. Deploy to SuperSeed Sepolia testnet:
```bash
# First, create a .env file from the example
cp .env.example .env
# Then, edit the .env file with your private key (and optional SUPR token address)
# Finally, run the deployment
npm run deploy:superseed
# or
npx hardhat run scripts/deploy-superseed.js --network superseedSepolia
```

## SuperSeed Deployment Guide

### Prerequisites

1. Make sure you have ETH on the SuperSeed Sepolia testnet to pay for gas fees
2. Set up your `.env` file with your wallet's private key

### Configuration

The deployment to SuperSeed is configured in `hardhat.config.js` with the following settings:
- Network name: `superseedSepolia`
- RPC URL: `https://sepolia.superseed.xyz`
- Chain ID: `53302`
- Gas price: `1 gwei` (as recommended in the SuperSeed documentation)

### Deployment Options

The deployment script (`scripts/deploy-superseed.js`) offers two options:

1. **Deploy with an existing $SUPR token**:
   - Set the `SUPR_TOKEN_ADDRESS` in your `.env` file to use an existing token
   - The TetriSeedGame contract will be configured to use this token address

2. **Deploy with a mock $SUPR token**:
   - Leave the `SUPR_TOKEN_ADDRESS` empty in your `.env` file
   - The script will automatically deploy a MockSUPR token first
   - Then it will deploy TetriSeedGame using the MockSUPR address

### After Deployment

After successful deployment, you will see the deployed contract addresses in the console. Make note of these addresses for frontend integration.

## Contract Details

### TetriSeedGame

The TetriSeedGame contract includes:

- **State Variables**:
  - `supToken`: Reference to the $SUPR token contract
  - `entryFee`: Current entry fee amount (default: 1 $SUPR)
  - `prizeDistribution`: Distribution percentages for top 5 winners (default: 50%, 30%, 10%, 5%, 5%)
  - `weeklyPrizePool`: Current accumulated prize pool
  - `seasonStartTime`: Timestamp when the current season started
  - `currentSeason`: The current season number

- **Core Functions**:
  - `enterGame()`: Players call this to enter the competitive mode, paying the entry fee
  - `depositTokens(uint256)`: Players can deposit additional tokens into the prize pool
  - `endSeason(address[5])`: Owner-only function to end the current season and distribute prizes to winners
  - `distributePrizes(address[5])`: Legacy function for prize distribution (deprecated, use endSeason instead)
  - `setEntryFee(uint256)`: Owner-only function to update the entry fee
  - `setDistribution(uint8[5])`: Owner-only function to update prize distribution percentages
  - `ownerWithdraw(uint256)`: Owner-only function to withdraw leftover funds

- **Events**:
  - `TokensDeposited`: Emitted when tokens are deposited into the contract
  - `TokensWithdrawn`: Emitted when tokens are withdrawn from the contract
  - `GameEntered`: Emitted when a player enters a game
  - `PrizesDistributed`: Emitted when prizes are distributed (legacy)
  - `PrizeAwarded`: Emitted for each winner when a season ends
  - `SeasonEnded`: Emitted when a season ends with total prize amount
  - `OwnerWithdrawal`: Emitted when the owner withdraws funds
  - `EntryFeeUpdated`: Emitted when the entry fee is updated
  - `DistributionUpdated`: Emitted when the prize distribution is updated

### Security Features

- **Safe Math**: Uses Solidity 0.8.x's built-in overflow protection
- **SafeERC20**: Uses OpenZeppelin's SafeERC20 for secure token transfers
- **Access Control**: Owner-only functions for administrative tasks
- **Reentrancy Protection**: All functions that transfer tokens are protected with nonReentrant modifier
- **Input Validation**: Thorough checks for invalid inputs and edge cases

### SuperSeed Compatibility

The contract is fully compatible with SuperSeed (an OP Stack chain):
- Uses ETH for gas (standard on OP Stack)
- No custom opcodes or address aliasing used
- Optimized gas usage (limited loops, efficient storage)
- Should work well within SuperSeed's high block gas limit (~30 million)

### MockSUPR

- ERC-20 token for testing
- Has mint functionality for testing purposes

### Integration with Frontend

The frontend will interact with the TetriSeedGame contract to:
1. Allow players to enter competitive games by paying the entry fee
2. Permit additional token deposits to the prize pool
3. Display current prize pool amounts
4. Show prize distribution percentages
5. Present leaderboards of top players
6. Show current and historical season information 

## Security Audit Results

A comprehensive security audit of the TetriSeedGame contract has been conducted, focusing on security vulnerabilities, authorization controls, and trust assumptions. The key findings are:

### Strengths

- **Reentrancy Protection**: The contract properly implements OpenZeppelin's `nonReentrant` modifier on all functions that involve token transfers, protecting against reentrancy attacks.
- **Authorization Controls**: Administrative functions are secured with the `onlyOwner` modifier, ensuring only the contract owner can execute them.
- **Input Validation**: The contract includes thorough checks for edge cases such as duplicate winner addresses and zero addresses.
- **Arithmetic Safety**: Solidity 0.8's built-in overflow protection is utilized throughout the contract.
- **Token Transfer Safety**: OpenZeppelin's `SafeERC20` library is properly implemented for all token operations.
- **Event Transparency**: Events are emitted for all significant state changes, providing transparency and off-chain tracking capabilities.

### Trust Assumptions

The contract includes the following trust assumptions:

1. **Winner Selection**: The primary trust assumption is that the contract owner (admin) will provide legitimate winners, as there is no on-chain verification of game results.
2. **Fund Management**: By design, players cannot withdraw their deposited tokens. Tokens remain in the contract for prize distribution or future game entries.

### Recommendations for Trust Minimization

The following recommendations could further enhance the security and trustlessness of the system:

1. **Multi-signature Ownership**: Consider implementing a multi-sig wallet as the contract owner to require multiple parties to agree on winner selection.
2. **Time-locked Operations**: Add a timelock to critical administrative functions to allow community review of proposed changes.
3. **On-chain Verification**: Long-term, develop mechanisms for on-chain verification of game results, such as:
   - Recording game scores on-chain
   - Using verifiable random functions for fairness components
   - Implementing zero-knowledge proofs for score verification
4. **Emergency Controls**: Implement a circuit breaker/pausable pattern to halt the contract in emergency situations.
5. **Automated Season Management**: Use Chainlink Keepers or similar services to automate season transitions.

### Conclusion

The TetriSeedGame contract implements security best practices through the use of OpenZeppelin libraries and careful input validation. The intentional design choice to keep player deposits within the contract ecosystem is a business decision that should be clearly communicated to users. The primary trust concern involves the centralized control of winner selection, which could be mitigated through the recommendations outlined above.

The complete test suite validates that the contract behavior matches the expected functionality, with particular focus on prize distribution, input validation, and reentrancy protection. 