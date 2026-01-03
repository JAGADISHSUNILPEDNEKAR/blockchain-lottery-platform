
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig, createConfig, configureChains, mainnet, sepolia } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from 'react-hot-toast';


// Pages
import HomePage from './pages/index';
import LotteryPage from './pages/lottery';
import GamesPage from './pages/games';
import BlackjackGame from './pages/BlackjackGame';
import BingoGame from './pages/BingoGame';

// Components
import Navbar from './components/Navbar';

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, mainnet],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.id === 11155111
          ? 'https://ethereum-sepolia-rpc.publicnode.com'
          : 'https://rpc.ankr.com/eth',
      }),
    }),
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_KEY || '' }),
    publicProvider()
  ]
);

// Configure wallets
const { wallets } = getDefaultWallets({
  appName: 'Blockchain Lottery Platform',
  projectId: process.env.REACT_APP_WALLET_CONNECT_ID || 'YOUR_PROJECT_ID',
  chains
});

const connectors = connectorsForWallets([...wallets]);

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});



function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: '#7c3aed', // violet-600
          accentColorForeground: 'white',
          borderRadius: 'large',
          fontStack: 'system',
          overlayBlur: 'small',
        })}
      >
        <Router>
          <div className="relative min-h-screen">
            <Navbar />
            <main className="container mx-auto px-4 py-8 relative z-10">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/lottery" element={<LotteryPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/games/blackjack" element={<BlackjackGame />} />
                <Route path="/games/bingo" element={<BingoGame />} />
              </Routes>
            </main>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                },
              }}
            />
          </div>
        </Router>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;