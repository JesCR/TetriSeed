# TetriSeed Admin Dashboard

Admin dashboard for managing the TetriSeed Game smart contract deployed at `0xd9b4190777287eAD1473A5EE44aA2a6aAE3b7b42` on the SuperSeed Sepolia testnet.

![TetriSeed Admin Dashboard](https://raw.githubusercontent.com/JesCR/TetriSeed/refs/heads/main/src/assets/images/logo_text.png)

## Table of Contents

- [Overview](#overview)
- [Installation Guide](#installation-guide)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Environment Configuration](#environment-configuration)
  - [Running the Dashboard](#running-the-dashboard)
- [Dashboard Functionality](#dashboard-functionality)
  - [Authentication](#authentication)
  - [Contract Information](#contract-information)
  - [Prize Distribution](#prize-distribution)
  - [Administrative Functions](#administrative-functions)
    - [Update Entry Fee](#update-entry-fee)
    - [Update Prize Distribution](#update-prize-distribution)
    - [Withdraw Funds](#withdraw-funds)
    - [End Season & Distribute Prizes](#end-season--distribute-prizes)
- [Security](#security)
- [Technology Stack](#technology-stack)

## Overview

The TetriSeed Admin Dashboard provides a user-friendly interface for the owner of the TetriSeed Game smart contract to manage game parameters, view status information, and perform administrative tasks. The dashboard ensures that only the contract owner can access these functions, providing a secure management interface.

## Installation Guide

### Prerequisites

Before installing the dashboard, ensure you have the following:

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- A web browser with MetaMask or another Ethereum wallet extension installed
- Access to the SuperSeed Sepolia network in your wallet
- The private key of the account that deployed the contract (for admin access)

### Setup

1. Clone this repository to your local machine:
   ```
   git clone https://github.com/your-repo/tetriseed-admin-dashboard.git
   cd tetriseed-admin-dashboard
   ```

2. Install the dependencies:
   ```
   npm install
   ```

### Environment Configuration

The dashboard uses environment variables for configuration. Create a `.env` file in the root of the project, using the `.env.example` file as a template:

```
cp .env.example .env
```

By default, the dashboard is configured to use the deployed contract at `0xd9b4190777287eAD1473A5EE44aA2a6aAE3b7b42`. If you need to override this or change network settings, update the following variables in your `.env` file:

```
REACT_APP_NETWORK_NAME=SuperSeed Sepolia Testnet
REACT_APP_CHAIN_ID=53302
REACT_APP_CONTRACT_ADDRESS=0xd9b4190777287eAD1473A5EE44aA2a6aAE3b7b42
```

### Running the Dashboard

1. Start the development server:
   ```
   npm start
   ```

2. The dashboard will be available at http://localhost:3000

3. For production deployment, build the optimized version:
   ```
   npm run build
   ```

   This creates a `build` directory with the production-ready files that can be deployed to any static hosting service.

## Dashboard Functionality

### Authentication

The dashboard uses Web3 wallet authentication to ensure only the contract owner can access administrative functions:

1. Click the "Connect Wallet" button to connect your Ethereum wallet
2. The dashboard verifies if the connected address is the contract owner
3. If authentication is successful, you'll be granted access to the admin dashboard
4. If the connected address is not the contract owner, access will be denied

### Contract Information

The dashboard provides real-time information about the TetriSeed Game contract:

- **Entry Fee**: Current cost for players to enter the game (in ETH)
- **Prize Pool**: Total amount accumulated in the current season's prize pool (in ETH)
- **Current Season**: The active season number
- **Season Ends**: Date and time when the current season will end
- **Refresh Data**: Button to manually refresh contract data

### Prize Distribution

The Prize Distribution card displays the current percentage breakdown of how prizes are distributed to winners:

- **Rank 1**: Percentage allocated to first place (default: 50%)
- **Rank 2**: Percentage allocated to second place (default: 30%)
- **Rank 3**: Percentage allocated to third place (default: 10%)
- **Rank 4**: Percentage allocated to fourth place (default: 5%)
- **Rank 5**: Percentage allocated to fifth place (default: 5%)

### Administrative Functions

#### Update Entry Fee

Allows the admin to change the cost for players to enter the game:

1. Enter the new fee amount in ETH (e.g., 0.0001)
2. Click "Update Fee"
3. Confirm the transaction in your wallet
4. Wait for the transaction to be processed
5. The dashboard will display a success message when complete

#### Update Prize Distribution

Modify how prizes are distributed among the top 5 winners:

1. Enter percentages for each rank (Ranks 1-5)
2. Ensure the percentages add up to exactly 100%
3. Click "Update Distribution"
4. Confirm the transaction in your wallet
5. Wait for the transaction to be processed
6. The dashboard will display the updated distribution once complete

#### Withdraw Funds

The contract owner can withdraw ETH from the prize pool:

1. Enter the amount to withdraw in ETH
2. Click "Withdraw"
3. Confirm the transaction in your wallet
4. The funds will be transferred to the owner's wallet

> **Note**: Excessive withdrawals will reduce the prize pool available to winners. Use this function judiciously.

#### End Season & Distribute Prizes

At the end of a season, the admin can distribute prizes to the top 5 players:

1. Enter the Ethereum addresses of the top 5 winners in order of their ranking
2. Click "End Season"
3. Confirm the transaction in your wallet
4. The contract will:
   - Distribute prizes according to the set percentages
   - Reset the prize pool
   - Increment the season number
   - Start a new season

> **Important**: All winner addresses must be valid Ethereum addresses. Duplicates are not allowed.

## Security

The dashboard implements several security features:

- **Owner Authentication**: Only the contract owner can access the dashboard
- **Secure Wallet Connection**: Uses Web3Modal for secure wallet integration
- **Transaction Confirmation**: All administrative actions require explicit wallet confirmation
- **Error Handling**: Comprehensive error handling for all contract interactions

## Technology Stack

- **Frontend**: React.js
- **Styling**: SCSS with retro gaming aesthetics
- **Ethereum Interaction**: ethers.js v6
- **Wallet Connection**: Web3Modal
- **Smart Contract**: Solidity (TetriSeed Game contract) 