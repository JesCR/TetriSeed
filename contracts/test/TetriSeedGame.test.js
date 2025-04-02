const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TetriSeedGame", function () {
  let owner, player1, player2, player3, player4, player5;
  let mockSupr, tetriSeedGame;
  const WEEK = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    [owner, player1, player2, player3, player4, player5] = await ethers.getSigners();

    // Deploy the mock SUPR token
    const MockSUPR = await ethers.getContractFactory("MockSUPR");
    mockSupr = await MockSUPR.deploy();
    await mockSupr.deploymentTransaction().wait();

    // Deploy the TetriSeedGame contract
    const TetriSeedGame = await ethers.getContractFactory("TetriSeedGame");
    tetriSeedGame = await TetriSeedGame.deploy(mockSupr.target);
    await tetriSeedGame.deploymentTransaction().wait();

    // Mint tokens to players for testing
    await mockSupr.mint(player1.address, ethers.parseEther("100"));
    await mockSupr.mint(player2.address, ethers.parseEther("100"));
    await mockSupr.mint(player3.address, ethers.parseEther("100"));
    await mockSupr.mint(player4.address, ethers.parseEther("100"));
    await mockSupr.mint(player5.address, ethers.parseEther("100"));

    // Approve the TetriSeedGame contract to spend tokens
    await mockSupr.connect(player1).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player2).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player3).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player4).approve(tetriSeedGame.target, ethers.parseEther("100"));
    await mockSupr.connect(player5).approve(tetriSeedGame.target, ethers.parseEther("100"));
  });

  describe("Initialization", function () {
    it("Should initialize with the correct token address", async function () {
      expect(await tetriSeedGame.supToken()).to.equal(mockSupr.target);
    });

    it("Should set the default entry fee to 1 SUPR", async function () {
      expect(await tetriSeedGame.entryFee()).to.equal(ethers.parseEther("1"));
    });

    it("Should set the default prize distribution", async function () {
      const distribution = await tetriSeedGame.getPrizeDistribution();
      expect(distribution[0]).to.equal(50);
      expect(distribution[1]).to.equal(30);
      expect(distribution[2]).to.equal(10);
      expect(distribution[3]).to.equal(5);
      expect(distribution[4]).to.equal(5);
    });

    it("Should initialize with season 1", async function () {
      expect(await tetriSeedGame.getCurrentSeason()).to.equal(1);
    });
  });

  describe("Game Entry", function () {
    it("Should allow a player to enter the game", async function () {
      // Get the current timestamp for more accurate testing
      const blockTime = await ethers.provider.getBlock("latest").then(b => b.timestamp);
      
      // Execute the transaction
      const tx = await tetriSeedGame.connect(player1).enterGame();
      await tx.wait();
      
      // Check the prize pool increased
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(ethers.parseEther("1"));
      
      // Check that both events were emitted
      await expect(tx)
        .to.emit(tetriSeedGame, "GameEntered")
        .withArgs(player1.address, ethers.parseEther("1"), await tx.getBlock().then(b => b.timestamp))
        .to.emit(tetriSeedGame, "TokensDeposited")
        .withArgs(player1.address, ethers.parseEther("1"), await tx.getBlock().then(b => b.timestamp));
    });

    it("Should transfer tokens from the player to the contract", async function () {
      const initialPlayerBalance = await mockSupr.balanceOf(player1.address);
      const initialContractBalance = await mockSupr.balanceOf(tetriSeedGame.target);

      await tetriSeedGame.connect(player1).enterGame();

      const finalPlayerBalance = await mockSupr.balanceOf(player1.address);
      const finalContractBalance = await mockSupr.balanceOf(tetriSeedGame.target);

      expect(initialPlayerBalance - finalPlayerBalance).to.equal(ethers.parseEther("1"));
      expect(finalContractBalance - initialContractBalance).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Token Deposits", function () {
    it("Should allow direct token deposits to the prize pool", async function () {
      const depositAmount = ethers.parseEther("5");
      
      // Execute the transaction
      const tx = await tetriSeedGame.connect(player1).depositTokens(depositAmount);
      await tx.wait();
      
      // Check the player balance increased
      expect(await tetriSeedGame.getPlayerBalance(player1.address)).to.equal(depositAmount);
      
      // Check that the event was emitted
      await expect(tx)
        .to.emit(tetriSeedGame, "TokensDeposited")
        .withArgs(player1.address, depositAmount, await tx.getBlock().then(b => b.timestamp));
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(tetriSeedGame.connect(player1).depositTokens(0))
        .to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should transfer tokens from player to contract", async function () {
      const depositAmount = ethers.parseEther("5");
      const initialPlayerBalance = await mockSupr.balanceOf(player1.address);
      const initialContractBalance = await mockSupr.balanceOf(tetriSeedGame.target);

      await tetriSeedGame.connect(player1).depositTokens(depositAmount);

      const finalPlayerBalance = await mockSupr.balanceOf(player1.address);
      const finalContractBalance = await mockSupr.balanceOf(tetriSeedGame.target);

      expect(initialPlayerBalance - finalPlayerBalance).to.equal(depositAmount);
      expect(finalContractBalance - initialContractBalance).to.equal(depositAmount);
    });
  });

  describe("Season End and Prize Distribution", function () {
    beforeEach(async function () {
      // Players deposit tokens
      for (const player of [player1, player2, player3, player4, player5]) {
        await tetriSeedGame.connect(player).depositTokens(ethers.parseEther("10"));
      }
      
      // Players enter the game
      await tetriSeedGame.connect(player1).enterGame();
      await tetriSeedGame.connect(player2).enterGame();
      await tetriSeedGame.connect(player3).enterGame();
      await tetriSeedGame.connect(player4).enterGame();
      await tetriSeedGame.connect(player5).enterGame();
    });

    it("Should distribute prizes correctly when ending a season", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      const prizePool = await tetriSeedGame.weeklyPrizePool();
      const currentSeason = await tetriSeedGame.getCurrentSeason();

      // Get initial balances in the player's contract balances
      const initialBalances = await Promise.all(winners.map(w => tetriSeedGame.getPlayerBalance(w)));

      // End the season and distribute prizes to player balances
      const tx = await tetriSeedGame.connect(owner).endSeason(winners);
      await tx.wait();
      
      // Check events
      await expect(tx)
        .to.emit(tetriSeedGame, "SeasonEnded")
        .withArgs(currentSeason, prizePool);
      
      // Get final balances in the player's contract balances
      const finalBalances = await Promise.all(winners.map(w => tetriSeedGame.getPlayerBalance(w)));

      // Check prize amounts
      const distribution = await tetriSeedGame.getPrizeDistribution();
      
      let totalDistributed = 0n;
      for (let i = 0; i < 4; i++) {
        const expectedPrize = (prizePool * BigInt(distribution[i])) / 100n;
        totalDistributed += expectedPrize;
        // Each player already had 9 SUPR (10 minus 1 for entry)
        expect(finalBalances[i] - initialBalances[i]).to.equal(expectedPrize);
      }
      
      // Last winner gets remainder
      expect(finalBalances[4] - initialBalances[4]).to.equal(prizePool - totalDistributed);

      // Check prize pool is reset to 0
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(0);
      
      // Check season was incremented
      expect(await tetriSeedGame.getCurrentSeason()).to.equal(currentSeason + 1n);
    });

    it("Should reject duplicate winner addresses", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player1.address]; // Duplicate
      await expect(tetriSeedGame.connect(owner).endSeason(winners))
        .to.be.revertedWith("Duplicate winner address");
    });

    it("Should reject zero addresses in winners array", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, ethers.ZeroAddress];
      await expect(tetriSeedGame.connect(owner).endSeason(winners))
        .to.be.revertedWith("Invalid winner address");
    });

    it("Should only allow the owner to end the season", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      await expect(tetriSeedGame.connect(player1).endSeason(winners))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow ending season with empty prize pool", async function () {
      // End the season once to empty prize pool
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      await tetriSeedGame.connect(owner).endSeason(winners);
      
      // Try to end season again with empty prize pool
      await expect(tetriSeedGame.connect(owner).endSeason(winners))
        .to.be.revertedWith("No prizes to distribute");
    });
  });

  describe("Prize Distribution", function () {
    beforeEach(async function () {
      // Players deposit tokens
      for (const player of [player1, player2, player3, player4, player5]) {
        await tetriSeedGame.connect(player).depositTokens(ethers.parseEther("10"));
      }
      
      // Players enter the game
      await tetriSeedGame.connect(player1).enterGame();
      await tetriSeedGame.connect(player2).enterGame();
      await tetriSeedGame.connect(player3).enterGame();
      await tetriSeedGame.connect(player4).enterGame();
      await tetriSeedGame.connect(player5).enterGame();
    });

    it("Should distribute prizes correctly", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      const prizePool = await tetriSeedGame.weeklyPrizePool();

      // Get initial balances in player's contract balances
      const initialBalances = await Promise.all(winners.map(w => tetriSeedGame.getPlayerBalance(w)));

      // Distribute prizes
      const tx = await tetriSeedGame.connect(owner).distributePrizes(winners);
      await tx.wait();

      // Get final balances in player's contract balances
      const finalBalances = await Promise.all(winners.map(w => tetriSeedGame.getPlayerBalance(w)));

      // Check prize amounts
      const distribution = await tetriSeedGame.getPrizeDistribution();
      
      let totalDistributed = 0n;
      for (let i = 0; i < 4; i++) {
        const expectedPrize = (prizePool * BigInt(distribution[i])) / 100n;
        totalDistributed += expectedPrize;
        expect(finalBalances[i] - initialBalances[i]).to.equal(expectedPrize);
      }
      
      // Last winner gets remainder
      expect(finalBalances[4] - initialBalances[4]).to.equal(prizePool - totalDistributed);

      // Check prize pool is updated
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(0);
    });

    it("Should only allow the owner to distribute prizes", async function () {
      const winners = [player1.address, player2.address, player3.address, player4.address, player5.address];
      await expect(tetriSeedGame.connect(player1).distributePrizes(winners))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow the owner to update the entry fee", async function () {
      await tetriSeedGame.connect(owner).setEntryFee(ethers.parseEther("2"));
      expect(await tetriSeedGame.entryFee()).to.equal(ethers.parseEther("2"));
    });

    it("Should allow the owner to update the prize distribution", async function () {
      const newDistribution = [40, 30, 20, 5, 5];
      await tetriSeedGame.connect(owner).setDistribution(newDistribution);
      
      const distribution = await tetriSeedGame.getPrizeDistribution();
      for (let i = 0; i < 5; i++) {
        expect(distribution[i]).to.equal(newDistribution[i]);
      }
    });

    it("Should revert if prize distribution doesn't add up to 100%", async function () {
      const invalidDistribution = [40, 30, 10, 5, 5]; // Only adds up to 90%
      await expect(tetriSeedGame.connect(owner).setDistribution(invalidDistribution))
        .to.be.revertedWith("Percentages must add up to 100");
    });

    it("Should allow the owner to withdraw leftover funds", async function () {
      // Player enters the game
      await tetriSeedGame.connect(player1).enterGame();
      
      const initialOwnerBalance = await mockSupr.balanceOf(owner.address);
      
      // Execute the withdrawal
      const tx = await tetriSeedGame.connect(owner).ownerWithdraw(ethers.parseEther("0.5"));
      await tx.wait();
      
      // Verify both events are emitted
      await expect(tx)
        .to.emit(tetriSeedGame, "OwnerWithdrawal")
        .withArgs(ethers.parseEther("0.5"), await tx.getBlock().then(b => b.timestamp))
        .to.emit(tetriSeedGame, "TokensWithdrawn")
        .withArgs(owner.address, ethers.parseEther("0.5"), await tx.getBlock().then(b => b.timestamp));
      
      const finalOwnerBalance = await mockSupr.balanceOf(owner.address);
      
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(ethers.parseEther("0.5"));
      expect(await tetriSeedGame.weeklyPrizePool()).to.equal(ethers.parseEther("0.5"));
    });
  });
}); 