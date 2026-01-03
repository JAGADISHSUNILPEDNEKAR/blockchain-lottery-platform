
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig, createConfig, configureChains, mainnet, sepolia } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          background: 'rgba(30, 41, 59, 0.8)',
        },
      },
    },
  },
});

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme({
        overlayBlur: 'small',
      })}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
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
                    background: '#1e293b',
                    color: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </ThemeProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;