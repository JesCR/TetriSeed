// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockSUPR
 * @dev A mock implementation of the SUPR token for testing purposes
 */
contract MockSUPR is ERC20, Ownable {
    /**
     * @dev Constructor
     * Initializes the token with name "Super Seed Token" and symbol "SUPR"
     */
    constructor() ERC20("Super Seed Token", "SUPR") {
        // Mint 1,000,000 tokens to the deployer
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @dev Allows the owner to mint additional tokens
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
} 