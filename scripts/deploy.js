const hre = require("hardhat");
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Starting deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  
  // VRF Configuration for Sepolia
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR_ADDRESS || "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || "0";
  const KEY_HASH = process.env.KEY_HASH || "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const CALLBACK_GAS_LIMIT = 2500000;
  
  // Deploy parameters
  const TICKET_PRICE = ethers.parseEther("0.01"); // 0.01 ETH per ticket
  const MAX_TICKETS_PER_PLAYER = 100;
  
  // Platform addresses (change these to your actual addresses)
  const CHARITY_ADDRESS = process.env.CHARITY_ADDRESS || deployer.address;
  const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS || deployer.address;
  
  try {
    // 1. Deploy Lottery Contract
    console.log("\n1. Deploying Lottery contract...");
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(
      VRF_COORDINATOR,
      SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT,
      TICKET_PRICE,
      MAX_TICKETS_PER_PLAYER,
      CHARITY_ADDRESS,
      PLATFORM_ADDRESS
    );
    
    await lottery.waitForDeployment();
    const lotteryAddress = await lottery.getAddress();
    console.log("Lottery deployed to:", lotteryAddress);
    
    // 2. Deploy Blackjack Contract
    console.log("\n2. Deploying Blackjack contract...");
    const Blackjack = await ethers.getContractFactory("Blackjack");
    const blackjack = await Blackjack.deploy(
      VRF_COORDINATOR,
      SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT
    );
    
    await blackjack.waitForDeployment();
    const blackjackAddress = await blackjack.getAddress();
    console.log("Blackjack deployed to:", blackjackAddress);
    
    // Fund Blackjack house
    console.log("Funding Blackjack house with 1 ETH...");
    await blackjack.fundHouse({ value: ethers.parseEther("1.0") });
    
    // 3. Deploy Bingo Contract
    console.log("\n3. Deploying Bingo contract...");
    const Bingo = await ethers.getContractFactory("Bingo");
    const bingo = await Bingo.deploy(
      VRF_COORDINATOR,
      SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT
    );
    
    await bingo.waitForDeployment();
    const bingoAddress = await bingo.getAddress();
    console.log("Bingo deployed to:", bingoAddress);
    
    // 4. Save deployment addresses
    const deploymentInfo = {
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        lottery: {
          address: lotteryAddress,
          ticketPrice: TICKET_PRICE.toString(),
          maxTicketsPerPlayer: MAX_TICKETS_PER_PLAYER,
        },
        blackjack: {
          address: blackjackAddress,
          minBet: ethers.parseEther("0.001").toString(),
          maxBet: ethers.parseEther("1").toString(),
        },
        bingo: {
          address: bingoAddress,
          cardPrice: ethers.parseEther("0.01").toString(),
        },
      },
      vrfConfig: {
        coordinator: VRF_COORDINATOR,
        subscriptionId: SUBSCRIPTION_ID,
        keyHash: KEY_HASH,
      },
    };
    
    const fs = require("fs");
    fs.writeFileSync(
      `./deployments/${hre.network.name}-deployment.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n✅ Deployment complete!");
    console.log("Deployment info saved to:", `./deployments/${hre.network.name}-deployment.json`);
    
    // 5. Verify contracts on Etherscan (if not on localhost)
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
      console.log("\n📝 Waiting for block confirmations before verification...");
      await lottery.deploymentTransaction().wait(6);
      
      console.log("Verifying Lottery contract...");
      await hre.run("verify:verify", {
        address: lotteryAddress,
        constructorArguments: [
          VRF_COORDINATOR,
          SUBSCRIPTION_ID,
          KEY_HASH,
          CALLBACK_GAS_LIMIT,
          TICKET_PRICE,
          MAX_TICKETS_PER_PLAYER,
          CHARITY_ADDRESS,
          PLATFORM_ADDRESS,
        ],
      });
      
      console.log("Verifying Blackjack contract...");
      await hre.run("verify:verify", {
        address: blackjackAddress,
        constructorArguments: [
          VRF_COORDINATOR,
          SUBSCRIPTION_ID,
          KEY_HASH,
          CALLBACK_GAS_LIMIT,
        ],
      });
      
      console.log("Verifying Bingo contract...");
      await hre.run("verify:verify", {
        address: bingoAddress,
        constructorArguments: [
          VRF_COORDINATOR,
          SUBSCRIPTION_ID,
          KEY_HASH,
          CALLBACK_GAS_LIMIT,
        ],
      });
    }
    
    // 6. Initial setup (optional)
    if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
      console.log("\n🎮 Performing initial setup for local testing...");
      
      // Start a lottery round
      console.log("Starting first lottery round (24 hours)...");
      await lottery.startLottery(86400); // 24 hours
      
      // Start a bingo game
      console.log("Starting first bingo game...");
      await bingo.startNewGame();
      
      console.log("✅ Initial setup complete!");
    }
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });