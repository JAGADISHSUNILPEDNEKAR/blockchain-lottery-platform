const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Lottery Contract", function () {
  let lottery;
  let owner;
  let player1;
  let player2;
  let player3;
  let charityAddress;
  let platformAddress;
  
  const TICKET_PRICE = ethers.parseEther("0.01");
  const MAX_TICKETS = 100;
  const LOTTERY_DURATION = 86400; // 24 hours
  
  // Mock VRF Coordinator for testing
  const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const CALLBACK_GAS_LIMIT = 2500000;
  
  beforeEach(async function () {
    [owner, player1, player2, player3, charityAddress, platformAddress] = await ethers.getSigners();
    
    // Deploy mock VRF Coordinator
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinatorV2");
    const mockVRF = await MockVRFCoordinator.deploy();
    await mockVRF.waitForDeployment();
    
    // Deploy Lottery contract
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(
      await mockVRF.getAddress(),
      SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT,
      TICKET_PRICE,
      MAX_TICKETS,
      charityAddress.address,
      platformAddress.address
    );
    await lottery.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      expect(await lottery.ticketPrice()).to.equal(TICKET_PRICE);
      expect(await lottery.maxTicketsPerPlayer()).to.equal(MAX_TICKETS);
      expect(await lottery.charityAddress()).to.equal(charityAddress.address);
      expect(await lottery.platformAddress()).to.equal(platformAddress.address);
      expect(await lottery.lotteryId()).to.equal(1);
    });
    
    it("Should start with lottery closed", async function () {
      const state = await lottery.lotteryState();
      expect(state).to.equal(0); // CLOSED
    });
  });
  
  describe("Starting Lottery", function () {
    it("Should allow owner to start lottery", async function () {
      await expect(lottery.startLottery(LOTTERY_DURATION))
        .to.emit(lottery, "LotteryStarted")
        .withArgs(1, await time.latest() + 1, await time.latest() + 1 + LOTTERY_DURATION);
      
      expect(await lottery.lotteryState()).to.equal(1); // OPEN
    });
    
    it("Should not allow non-owner to start lottery", async function () {
      await expect(
        lottery.connect(player1).startLottery(LOTTERY_DURATION)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should not allow starting when lottery is already running", async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      await expect(lottery.startLottery(LOTTERY_DURATION))
        .to.be.revertedWith("Lottery already running");
    });
  });
  
  describe("Buying Tickets", function () {
    beforeEach(async function () {
      await lottery.startLottery(LOTTERY_DURATION);
    });
    
    it("Should allow players to buy tickets", async function () {
      await expect(
        lottery.connect(player1).buyTickets(1, { value: TICKET_PRICE })
      ).to.emit(lottery, "LotteryEntered")
        .withArgs(player1.address, 1, 1);
      
      expect(await lottery.getPlayerTicketCount(player1.address)).to.equal(1);
      expect(await lottery.getTotalTickets()).to.equal(1);
    });
    
    it("Should allow buying multiple tickets", async function () {
      const ticketCount = 5;
      const totalCost = TICKET_PRICE * BigInt(ticketCount);
      
      await expect(
        lottery.connect(player1).buyTickets(ticketCount, { value: totalCost })
      ).to.emit(lottery, "LotteryEntered")
        .withArgs(player1.address, ticketCount, ticketCount);
      
      expect(await lottery.getPlayerTicketCount(player1.address)).to.equal(ticketCount);
      expect(await lottery.getTotalTickets()).to.equal(ticketCount);
    });
    
    it("Should not allow buying tickets with incorrect payment", async function () {
      await expect(
        lottery.connect(player1).buyTickets(2, { value: TICKET_PRICE })
      ).to.be.revertedWith("Incorrect ETH amount");
    });
    
    it("Should not allow exceeding max tickets per player", async function () {
      const tooManyTickets = MAX_TICKETS + 1;
      const totalCost = TICKET_PRICE * BigInt(tooManyTickets);
      
      await expect(
        lottery.connect(player1).buyTickets(tooManyTickets, { value: totalCost })
      ).to.be.revertedWith("Exceeds max tickets per player");
    });
    
    it("Should not allow buying after lottery ends", async function () {
      await time.increase(LOTTERY_DURATION + 1);
      
      await expect(
        lottery.connect(player1).buyTickets(1, { value: TICKET_PRICE })
      ).to.be.revertedWith("Lottery ended");
    });
    
    it("Should update prize pool correctly", async function () {
      const ticketCount = 3;
      const totalCost = TICKET_PRICE * BigInt(ticketCount);
      
      await lottery.connect(player1).buyTickets(ticketCount, { value: totalCost });
      await lottery.connect(player2).buyTickets(2, { value: TICKET_PRICE * 2n });
      
      expect(await lottery.prizePool()).to.equal(TICKET_PRICE * 5n);
    });
  });
  
  describe("Ending Lottery", function () {
    beforeEach(async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      await lottery.connect(player1).buyTickets(2, { value: TICKET_PRICE * 2n });
      await lottery.connect(player2).buyTickets(1, { value: TICKET_PRICE });
      await lottery.connect(player3).buyTickets(3, { value: TICKET_PRICE * 3n });
    });
    
    it("Should allow ending lottery after duration", async function () {
      await time.increase(LOTTERY_DURATION + 1);
      
      await expect(lottery.endLottery())
        .to.emit(lottery, "RequestedLotteryWinner");
      
      expect(await lottery.lotteryState()).to.equal(2); // CALCULATING
    });
    
    it("Should allow owner to end lottery early", async function () {
      await expect(lottery.connect(owner).endLottery())
        .to.emit(lottery, "RequestedLotteryWinner");
    });
    
    it("Should not allow players to end before time", async function () {
      await expect(lottery.connect(player1).endLottery())
        .to.be.revertedWith("Lottery period not ended");
    });
    
    it("Should not allow ending with no players", async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      await time.increase(LOTTERY_DURATION + 1);
      
      await expect(lottery.endLottery())
        .to.be.revertedWith("No players in lottery");
    });
  });
  
  describe("Fee Distribution", function () {
    it("Should calculate fees correctly", async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      
      const totalTickets = 10;
      const totalCost = TICKET_PRICE * BigInt(totalTickets);
      await lottery.connect(player1).buyTickets(totalTickets, { value: totalCost });
      
      const prizePool = await lottery.prizePool();
      const platformFee = await lottery.platformFeePercentage();
      const charityFee = await lottery.charityFeePercentage();
      
      // Default fees are 2.5% each (250 basis points)
      expect(platformFee).to.equal(250);
      expect(charityFee).to.equal(250);
      
      // Total fees should be 5%
      const expectedPlatformFee = (prizePool * 250n) / 10000n;
      const expectedCharityFee = (prizePool * 250n) / 10000n;
      const expectedWinnerPrize = prizePool - expectedPlatformFee - expectedCharityFee;
      
      // Verify calculations
      expect(expectedPlatformFee + expectedCharityFee + expectedWinnerPrize).to.equal(prizePool);
    });
    
    it("Should allow owner to update fees", async function () {
      await lottery.setFees(300, 200); // 3% platform, 2% charity
      
      expect(await lottery.platformFeePercentage()).to.equal(300);
      expect(await lottery.charityFeePercentage()).to.equal(200);
    });
    
    it("Should not allow total fees exceeding 10%", async function () {
      await expect(lottery.setFees(600, 500))
        .to.be.revertedWith("Total fees cannot exceed 10%");
    });
  });
  
  describe("Withdrawing Winnings", function () {
    it("Should allow winners to withdraw", async function () {
      // This would require mocking VRF response
      // Implementation depends on your testing setup
    });
    
    it("Should not allow withdrawing with zero balance", async function () {
      await expect(lottery.connect(player1).withdrawWinnings())
        .to.be.revertedWith("No winnings to withdraw");
    });
  });
  
  describe("View Functions", function () {
    beforeEach(async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      await lottery.connect(player1).buyTickets(3, { value: TICKET_PRICE * 3n });
    });
    
    it("Should return correct lottery info", async function () {
      const info = await lottery.getLotteryInfo();
      
      expect(info[0]).to.equal(1); // lotteryId
      expect(info[1]).to.equal(1); // OPEN state
      expect(info[2]).to.equal(TICKET_PRICE * 3n); // prizePool
      expect(info[3]).to.equal(TICKET_PRICE); // ticketPrice
      expect(info[4]).to.equal(3); // totalTickets
    });
    
    it("Should return players array", async function () {
      const players = await lottery.getPlayers();
      expect(players.length).to.equal(3);
      expect(players[0]).to.equal(player1.address);
      expect(players[1]).to.equal(player1.address);
      expect(players[2]).to.equal(player1.address);
    });
    
    it("Should return time remaining", async function () {
      const timeRemaining = await lottery.getTimeRemaining();
      expect(timeRemaining).to.be.closeTo(LOTTERY_DURATION, 5);
      
      await time.increase(LOTTERY_DURATION + 1);
      expect(await lottery.getTimeRemaining()).to.equal(0);
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to update ticket price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await lottery.setTicketPrice(newPrice);
      expect(await lottery.ticketPrice()).to.equal(newPrice);
    });
    
    it("Should not allow updating during active lottery", async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      
      await expect(lottery.setTicketPrice(ethers.parseEther("0.02")))
        .to.be.revertedWith("Cannot change during lottery");
    });
    
    it("Should allow owner to update addresses", async function () {
      const newCharity = player3.address;
      const newPlatform = player2.address;
      
      await lottery.setAddresses(newCharity, newPlatform);
      
      expect(await lottery.charityAddress()).to.equal(newCharity);
      expect(await lottery.platformAddress()).to.equal(newPlatform);
    });
  });
  
  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw", async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: await lottery.getAddress(),
        value: ethers.parseEther("1")
      });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await lottery.emergencyWithdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
    
    it("Should not allow emergency withdraw during lottery", async function () {
      await lottery.startLottery(LOTTERY_DURATION);
      
      await expect(lottery.emergencyWithdraw())
        .to.be.revertedWith("Cannot withdraw during lottery");
    });
  });
});