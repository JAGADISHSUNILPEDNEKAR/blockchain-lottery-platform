# 🎰 Blockchain Lottery & Gaming Platform

A fully decentralized, on-chain lottery and gaming platform built on Ethereum using Solidity smart contracts, Chainlink VRF for verifiable randomness, and a modern React frontend.

## 🌟 Features

### Core Games
- **🎟️ Lottery System**: Automated ticket sales, transparent prize pools, and fair winner selection
- **🃏 Blackjack**: On-chain card game with provably fair dealing
- **🎯 Bingo**: Multiplayer bingo with automated number drawing

### Technical Features
- **Verifiable Randomness**: Integration with Chainlink VRF for transparent and tamper-proof random number generation
- **Automated Payouts**: Smart contracts handle all prize distributions automatically
- **Fee Management**: Configurable platform and charity fees
- **Gas Optimization**: Efficient contract design to minimize transaction costs
- **Comprehensive Testing**: Full test coverage with unit and integration tests

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│                 │     │              │     │             │
│  React Frontend │────▶│  Smart       │────▶│  Chainlink  │
│  (Web3/Ethers)  │     │  Contracts   │     │  VRF Oracle │
│                 │     │              │     │             │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │
         │                      │
         ▼                      ▼
   ┌───────────┐         ┌──────────┐
   │           │         │          │
   │  MetaMask │         │ Ethereum │
   │  Wallet   │         │ Blockchain│
   │           │         │          │
   └───────────┘         └──────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- MetaMask wallet
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/blockchain-lottery-platform.git
cd blockchain-lottery-platform
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `SEPOLIA_RPC`: Sepolia testnet RPC URL (get from Infura/Alchemy)
- `DEPLOYER_PRIVATE_KEY`: Your wallet private key for deployment
- `ETHERSCAN_API_KEY`: For contract verification
- `VRF_SUBSCRIPTION_ID`: Chainlink VRF subscription ID

### Deployment

1. **Start local blockchain (for testing)**
```bash
npm run node
```

2. **Deploy contracts to local network**
```bash
npm run deploy:localhost
```

3. **Deploy to Sepolia testnet**
```bash
npm run deploy:sepolia
```

4. **Verify contracts on Etherscan**
```bash
npm run verify -- --network sepolia
```

### Running the Frontend

1. **Update contract addresses**
Edit `frontend/src/utils/contracts.ts` with your deployed contract addresses

2. **Start the development server**
```bash
npm run frontend
```

3. **Build for production**
```bash
npm run frontend:build
```

## 📝 Smart Contract Details

### Lottery Contract
- **Ticket Purchase**: Users can buy multiple tickets for ongoing lottery
- **Prize Distribution**: Automated winner selection and prize transfer
- **Fee Structure**: Configurable platform and charity fees
- **Time-based Rounds**: Each lottery runs for a specified duration

### Blackjack Contract
- **Standard Rules**: Hit, Stand, Double Down functionality
- **House Edge**: Configurable house advantage
- **Instant Payouts**: Automatic prize calculation and distribution

### Bingo Contract
- **Card Generation**: Unique random cards for each player
- **Number Drawing**: Timed automatic number drawing
- **Multiple Winners**: Support for multiple winners per game

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/Lottery.test.js

# Run with gas reporting
npm run gas-report
```

## 🔒 Security Considerations

- ✅ Reentrancy protection on all payment functions
- ✅ Access control for admin functions
- ✅ Safe math operations (Solidity 0.8+)
- ✅ Chainlink VRF for secure randomness
- ✅ Comprehensive test coverage
- ✅ Gas optimization strategies

**⚠️ Important**: This code is for educational purposes. Always conduct professional audits before mainnet deployment.

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:
- Storage packing for struct variables
- Efficient loop implementations
- Minimal external calls
- Event emission for off-chain data

## 🛠️ Development Tools

- **Hardhat**: Development environment and testing
- **OpenZeppelin**: Secure contract libraries
- **Chainlink VRF**: Verifiable random number generation
- **Ethers.js**: Ethereum interaction library
- **React**: Frontend framework
- **Wagmi/RainbowKit**: Web3 React hooks and wallet connection

## 📚 Contract Verification

After deployment, verify your contracts:

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor arg 1" "Constructor arg 2"
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ Legal Disclaimer

**IMPORTANT**: Online gambling and lottery systems are subject to various legal regulations depending on jurisdiction. Before deploying this system:

1. Consult with legal professionals about gambling laws in your jurisdiction
2. Obtain necessary licenses and permits
3. Implement appropriate KYC/AML procedures if required
4. Ensure compliance with all applicable regulations

This code is provided for educational purposes only. The authors are not responsible for any legal consequences of deploying this system.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues and PRs

## 🗺️ Roadmap

- [x] Basic lottery implementation
- [x] Chainlink VRF integration
- [x] Blackjack game
- [x] Bingo game
- [ ] NFT prize support
- [ ] Multi-token support (ERC-20)
- [ ] Layer 2 deployment (Polygon, Arbitrum)
- [ ] Advanced game statistics
- [ ] Referral program
- [ ] Mobile app

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Chainlink for VRF oracle services
- Ethereum Foundation for the platform
- Community contributors

---

**Built with ❤️ for the decentralized future**