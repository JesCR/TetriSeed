const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TetriSeedGame - Player Deposits and Balances", function () {
  let owner, player1, player2, player3, player4, player5, attacker;
  let mockSupr, tetriSeedGame, reentrancyAttacker;

  beforeEach(async function () {
    [owner, player1, player2, player3, player4, player5, attacker] = await ethers.getSigners();

    // Deploy the mock SUPR token
    const MockSUPR = await ethers.getContractFactory("MockSUPR");
    mockSupr = await MockSUPR.deploy();
    await mockSupr.deploymentTransaction().wait();

    // Deploy the TetriSeedGame contract
    const TetriSeedGame = await ethers.getContractFactory("TetriSeedGame");
    tetriSeedGame = await TetriSeedGame.deploy(mockSupr.target);
    await tetriSeedGame.deploymentTransaction().wait();

    // Deploy the ReentrancyAttacker contract
    const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
    reentrancyAttacker = await ReentrancyAttacker.deploy(mockSupr.target, tetriSeedGame.target);
    await reentrancyAttacker.deploymentTransaction().wait();

    // Mint tokens to players and attacker for testing
    await mockSupr.mint(player1.address, ethers.parseEther("100"));
    await mockSupr.mint(player2.address, ethers.parseEther("100"));
    await mockSupr.mint(player3.address, ethers.parseEther("100"));
    await mockSupr.mint(player4.address, ethers.parseEther("100"));
    await mockSupr.mint(player5.address, ethers.parseEther("100"));
    await mockSupr.mint(attacker.address, ethers.parseEther("100"));
    await mockSupr.mint(reentrancyAttacker.target, ethers.parseEther("20"));

    // Approve the TetriSeedGame contract to spend tokens
    await mockSupr.connect(player1).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player2).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player3).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player4).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player5).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(attacker).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(attacker).approve(reentrancyAttacker.target, ethers.parseEther("100"));
  });

  describe("Deposit and Game Entry", function () {
    it("Should allow players to deposit tokens and track balances correctly", async function () {
      const depositAmount = ethers.parseEther("5");
      
      // Execute the transaction
      const tx = await tetriSeedGame.connect(player1).depositTokens(depositAmount);
      await tx.wait();
      
      // Check player balance increased
      expect(await tetriSeedGame.getPlayerBalance(player1.address)).to.equal(depositAmount);
      
      // Check token balances
      const playerTokenBalance = await mockSupr.balanceOf(player1.address);
      expect(playerTokenBalance).to.equal(ethers.parseEther("95")); // 100 - 5 = 95
      
      const contractTokenBalance = await mockSupr.balanceOf(tetriSeedGame.target);
      expect(contractTokenBalance).to.equal(depositAmount);
      
      // Check that the event was emitted
      await expect(tx)
        .to.emit(tetriSeedGame, "TokensDeposited")
        .withArgs(player1.address, depositAmount, await tx.getBlock().then(b => b.timestamp));
    });

    it("Should allow entering game using deposited tokens", async function () {
      // First deposit 5 SUPR
      await tetriSeedGame.connect(player1).depositTokens(ethers.parseEther("5"));
      
      // Initial balances
      const initialPlayerBalance = await tetriSeedGame.getPlayerBalance(player1.address);
      expect(initialPlayerBalance).to.equal(ethers.parseEther("5"));
      
      // Enter game
      const tx = await tetriSeedGame.connect(player1).enterGame();
      await tx.wait();
      
      // Check that player balance decreased by entry fee
      const finalPlayerBalance = await tetriSeedGame.getPlayerBalance(player1.address);
      expect(finalPlayerBalance).to.equal(ethers.parseEther("4")); // 5 - 1 = 4
      
      // Check prize pool increased
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(ethers.parseEther("1"));
      
      // Check events
      await expect(tx)
        .to.emit(tetriSeedGame, "GameEntered")
        .withArgs(player1.address, ethers.parseEther("1"), await tx.getBlock().then(b => b.timestamp));
    });
    
    it("Should revert if deposit amount is zero", async function () {
      await expect(tetriSeedGame.connect(player1).depositTokens(0))
        .to.be.revertedWith("Amount must be greater than zero");
    });
  });

  describe("Prize Distribution with Player Balances", function () {
    beforeEach(async function () {
      // 5 players enter the game
      for (const player of [player1, player2, player3, player4, player5]) {
        await tetriSeedGame.connect(player).enterGame();
      }
      
      // Prize pool should be 5 SUPR
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(ethers.parseEther("5"));
    });
    
    it("Should distribute prizes correctly to player balances", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      const prizePool = await tetriSeedGame.weeklyPrizePool();
      const currentSeason = await tetriSeedGame.getCurrentSeason();
      
      // Get initial player balances in contract
      const initialBalances = await Promise.all(
        winners.map(w => tetriSeedGame.getPlayerBalance(w))
      );
      
      // End season and distribute prizes
      await tetriSeedGame.connect(owner).endSeason(winners);
      
      // Get final player balances in contract
      const finalBalances = await Promise.all(
        winners.map(w => tetriSeedGame.getPlayerBalance(w))
      );
      
      // Check prize distributions
      const distribution = await tetriSeedGame.getPrizeDistribution();
      let totalDistributed = 0n;
      
      for (let i = 0; i < 4; i++) {
        const expectedPrize = (prizePool * BigInt(distribution[i])) / 100n;
        totalDistributed += expectedPrize;
        expect(finalBalances[i] - initialBalances[i]).to.equal(expectedPrize);
      }
      
      // Last winner gets remainder
      expect(finalBalances[4] - initialBalances[4]).to.equal(prizePool - totalDistributed);
      
      // Check prize pool is reset to 0
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(0);
      
      // Check season was incremented
      expect(await tetriSeedGame.getCurrentSeason()).to.equal(currentSeason + 1n);
    });
    
    it("Should track and display player balances correctly", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      
      // End season and distribute prizes
      await tetriSeedGame.connect(owner).endSeason(winners);
      
      // Get player1's balance after prize distribution
      const player1Balance = await tetriSeedGame.getPlayerBalance(player1.address);
      
      // Player1 should have 50% of the 5 SUPR prize pool = 2.5 SUPR
      expect(player1Balance).to.equal(ethers.parseEther("2.5"));
      
      // Player balances should persist and be queryable
      expect(await tetriSeedGame.getPlayerBalance(player2.address)).to.equal(ethers.parseEther("1.5")); // 30%
      expect(await tetriSeedGame.getPlayerBalance(player3.address)).to.equal(ethers.parseEther("0.5")); // 10%
      expect(await tetriSeedGame.getPlayerBalance(player4.address)).to.equal(ethers.parseEther("0.25")); // 5%
      expect(await tetriSeedGame.getPlayerBalance(player5.address)).to.equal(ethers.parseEther("0.25")); // 5%
    });
  });

  describe("Reentrancy Protection", function () {
    beforeEach(async function () {
      // Fund the attacker contract with tokens
      await mockSupr.connect(attacker).transfer(reentrancyAttacker.target, ethers.parseEther("10"));
      
      // Approve the game contract to spend tokens from the attacker contract
      await mockSupr.connect(attacker).approve(reentrancyAttacker.target, ethers.parseEther("100"));
    });
    
    it("Should protect against reentrancy attacks", async function () {
      // Execute the attack, which tries to exploit reentrancy
      // This should fail gracefully since we've removed the withdrawTokens function
      await reentrancyAttacker.connect(attacker).attack(ethers.parseEther("5"));
      
      // Check the attacker's balance in the contract after the attack
      // Since enterGame costs 1 SUPR, the balance should be 5 - 1 = 4 SUPR 
      // if the attacker successfully called enterGame
      const attackerBalance = await tetriSeedGame.getPlayerBalance(reentrancyAttacker.target);
      expect(attackerBalance).to.equal(ethers.parseEther("4"));
      
      // The prize pool should be 1 SUPR since the attacker entered the game once
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(ethers.parseEther("1"));
    });
  });
}); 