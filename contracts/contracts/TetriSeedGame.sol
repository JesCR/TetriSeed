// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TetriSeedGame
 * @dev Smart contract for TetriSeed competitive game mode
 * Handles entry fees, prize pools, and distribution for competitive play
 * Compatible with SuperSeed (OP Stack, Bedrock)
 */
contract TetriSeedGame is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State variables
    IERC20 public supToken;               // The $SUPR token used for entry fees
    uint256 public entryFee;              // Entry fee in $SUPR tokens
    uint8[5] public prizeDistribution;    // Distribution percentages for top 5 winners
    uint256 public weeklyPrizePool;       // Current weekly prize pool amount
    uint256 public seasonStartTime;       // Start timestamp of the current season (week)
    uint256 public constant SEASON_DURATION = 7 days;  // Monday-Sunday
    uint256 public currentSeason;         // Current season number
    
    // Player balances tracking
    mapping(address => uint256) public playerBalances;  // Track deposited tokens by player

    // Events
    event TokensDeposited(address indexed player, uint256 amount, uint256 timestamp);
    event TokensWithdrawn(address indexed recipient, uint256 amount, uint256 timestamp);
    event GameEntered(address indexed player, uint256 fee, uint256 timestamp);
    event PrizesDistributed(address[5] winners, uint256[5] amounts, uint256 totalDistributed);
    event OwnerWithdrawal(uint256 amount, uint256 timestamp);
    event EntryFeeUpdated(uint256 oldFee, uint256 newFee);
    event DistributionUpdated(uint8[5] oldDistribution, uint8[5] newDistribution);
    event PrizeAwarded(address indexed winner, uint256 amount, uint8 rank, uint256 indexed season);
    event SeasonEnded(uint256 indexed season, uint256 totalPrize);

    /**
     * @dev Constructor
     * @param _tokenAddress Address of the $SUPR token
     */
    constructor(address _tokenAddress) {
        supToken = IERC20(_tokenAddress);
        entryFee = 1 ether;  // Default 1 $SUPR (assuming 18 decimals)
        
        // Default prize distribution: 50%, 30%, 10%, 5%, 5%
        prizeDistribution = [50, 30, 10, 5, 5];
        
        // Initialize season start time to current Monday
        uint256 currentTime = block.timestamp;
        uint256 weekday = (currentTime / 1 days + 4) % 7; // 0 = Monday, 6 = Sunday
        seasonStartTime = currentTime - weekday * 1 days;
        currentSeason = 1; // Start with season 1
    }

    /**
     * @dev Allow a player to enter the game by paying the entry fee
     * Entry fee is directly transferred from player to the contract
     */
    function enterGame() external nonReentrant {
        // Reset prize pool if a new week has started
        if (block.timestamp >= seasonStartTime + SEASON_DURATION) {
            uint256 weeksPassed = (block.timestamp - seasonStartTime) / SEASON_DURATION;
            seasonStartTime += weeksPassed * SEASON_DURATION;
            // Note: We don't reset weeklyPrizePool here, it accumulates
        }

        // Check if the player has sufficient balance or transfer tokens
        if (playerBalances[msg.sender] >= entryFee) {
            // Use player's deposited balance
            playerBalances[msg.sender] -= entryFee;
        } else {
            // Transfer the entry fee from player to the contract
            supToken.safeTransferFrom(msg.sender, address(this), entryFee);
        }
        
        // Add entry fee to the prize pool
        weeklyPrizePool += entryFee;
        
        // Emit both deposit and game entry events
        emit TokensDeposited(msg.sender, entryFee, block.timestamp);
        emit GameEntered(msg.sender, entryFee, block.timestamp);
    }

    /**
     * @dev End the current season and distribute prizes to the top 5 players
     * @param winners Array of addresses of the top 5 winners in order
     */
    function endSeason(address[5] calldata winners) external onlyOwner nonReentrant {
        require(weeklyPrizePool > 0, "No prizes to distribute");
        
        // Check for valid addresses (no zero address and no duplicates)
        for (uint8 i = 0; i < 5; i++) {
            require(winners[i] != address(0), "Invalid winner address");
            
            // Check for duplicates
            for (uint8 j = i + 1; j < 5; j++) {
                require(winners[i] != winners[j], "Duplicate winner address");
            }
        }
        
        uint256 total = weeklyPrizePool;
        uint256[5] memory shares;
        uint256 totalDistributed = 0;
        
        // Calculate shares for the first 4 winners
        for (uint8 i = 0; i < 4; i++) {
            shares[i] = (total * prizeDistribution[i]) / 100;
            totalDistributed += shares[i];
        }
        
        // Last winner gets the remainder to ensure 100% distribution
        shares[4] = total - totalDistributed;
        
        // Transfer prizes to winners and emit events
        for (uint8 i = 0; i < 5; i++) {
            if (shares[i] > 0) {
                // Add the winnings to the player's balance
                playerBalances[winners[i]] += shares[i];
                
                emit TokensWithdrawn(winners[i], shares[i], block.timestamp);
                emit PrizeAwarded(winners[i], shares[i], i + 1, currentSeason);
            }
        }
        
        // Reset prize pool and increment season
        uint256 seasonTotal = weeklyPrizePool;
        weeklyPrizePool = 0;
        currentSeason += 1;
        
        // Start a new season
        seasonStartTime = block.timestamp;
        uint256 weekday = (seasonStartTime / 1 days + 4) % 7; // 0 = Monday, 6 = Sunday
        seasonStartTime = seasonStartTime - weekday * 1 days;
        
        emit SeasonEnded(currentSeason - 1, seasonTotal);
    }

    /**
     * @dev Distribute prizes to the top 5 players
     * @param winners Array of addresses of the top 5 winners in order
     * Note: This function is deprecated, use endSeason instead for full season handling
     */
    function distributePrizes(address[5] calldata winners) external onlyOwner nonReentrant {
        require(weeklyPrizePool > 0, "No prizes to distribute");
        
        uint256 totalPrizeDistributed = 0;
        uint256[5] memory amounts;
        
        // Calculate and transfer prizes to each winner
        for (uint8 i = 0; i < 5; i++) {
            require(winners[i] != address(0), "Invalid winner address");
            
            // Calculate prize amount
            uint256 prizeAmount = (weeklyPrizePool * prizeDistribution[i]) / 100;
            amounts[i] = prizeAmount;
            totalPrizeDistributed += prizeAmount;
            
            // Transfer prize to winner
            if (prizeAmount > 0) {
                // Add the prize to the player's balance
                playerBalances[winners[i]] += prizeAmount;
                
                emit TokensWithdrawn(winners[i], prizeAmount, block.timestamp);
            }
        }
        
        // Update prize pool
        weeklyPrizePool -= totalPrizeDistributed;
        
        emit PrizesDistributed(winners, amounts, totalPrizeDistributed);
    }

    /**
     * @dev Update the entry fee
     * @param newFee The new entry fee in $SUPR tokens
     */
    function setEntryFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Entry fee must be greater than zero");
        uint256 oldFee = entryFee;
        entryFee = newFee;
        emit EntryFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Update the prize distribution percentages
     * @param newPercentages New distribution percentages for top 5 winners
     */
    function setDistribution(uint8[5] calldata newPercentages) external onlyOwner {
        // Verify total is 100%
        uint16 total = 0;
        for (uint8 i = 0; i < 5; i++) {
            total += newPercentages[i];
        }
        require(total == 100, "Percentages must add up to 100");
        
        uint8[5] memory oldDistribution = prizeDistribution;
        prizeDistribution = newPercentages;
        
        emit DistributionUpdated(oldDistribution, newPercentages);
    }

    /**
     * @dev Allow the owner to withdraw leftover funds
     * @param amount Amount to withdraw
     */
    function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= weeklyPrizePool, "Amount exceeds available funds");
        
        weeklyPrizePool -= amount;
        supToken.safeTransfer(owner(), amount);
        
        emit TokensWithdrawn(owner(), amount, block.timestamp);
        emit OwnerWithdrawal(amount, block.timestamp);
    }

    /**
     * @dev Allow a user to deposit additional tokens directly into the prize pool
     * @param amount Amount to deposit
     */
    function depositTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        
        // Transfer tokens from sender to contract
        supToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Add to player's balance
        playerBalances[msg.sender] += amount;
        
        emit TokensDeposited(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Get the current season end time
     * @return End timestamp of the current season
     */
    function getCurrentSeasonEndTime() external view returns (uint256) {
        return seasonStartTime + SEASON_DURATION;
    }

    /**
     * @dev Get the full prize distribution for UI display
     * @return Array of distribution percentages
     */
    function getPrizeDistribution() external view returns (uint8[5] memory) {
        return prizeDistribution;
    }
    
    /**
     * @dev Get the current season number
     * @return Current season number
     */
    function getCurrentSeason() external view returns (uint256) {
        return currentSeason;
    }
    
    /**
     * @dev Get the balance of a player
     * @param player Address of the player
     * @return Balance of the player
     */
    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }
} 