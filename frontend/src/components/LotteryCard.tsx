import React, { useState, useEffect } from 'react';
import { useContractRead, useContractWrite, useAccount, useWaitForTransaction } from 'wagmi';
import { formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LOTTERY_ABI, LOTTERY_ADDRESS } from '../utils/contracts';

// Icons
const Icons = {
  Casino: () => <span className="text-2xl">🎲</span>,
  Timer: () => <span className="text-xl">⏳</span>,
  Groups: () => <span className="text-xl">👥</span>,
  Money: () => <span className="text-xl">💰</span>,
  Ticket: () => <span className="text-xl">🎟️</span>,
  Trophy: () => <span className="text-xl">🏆</span>,
  Wallet: () => <span className="text-xl">👛</span>,
};

interface LotteryInfo {
  lotteryId: bigint;
  state: number;
  prizePool: bigint;
  ticketPrice: bigint;
  totalTickets: bigint;
  startTime: bigint;
  endTime: bigint;
}

const LotteryCard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [ticketCount, setTicketCount] = useState<string>('1');
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // -------------------------------------------------------------
  // WAGMI HOOKS (Logic Preserved)
  // -------------------------------------------------------------

  const {
    data: lotteryInfo,
    refetch: refetchInfo,
    isError: isLotteryError,
    error: lotteryError,
    isLoading: isLotteryLoading
  } = useContractRead({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getLotteryInfo',
    watch: true,
  }) as {
    data: LotteryInfo | undefined;
    refetch: () => void;
    isError: boolean;
    error: Error | null;
    isLoading: boolean;
  };

  const { data: playerTickets } = useContractRead({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getPlayerTicketCount',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  const { data: recentWinner } = useContractRead({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'recentWinner',
    watch: true,
  });

  const {
    data: buyData,
    write: buyTickets,
    isLoading: isBuying,
  } = useContractWrite({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'buyTickets',
  });

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: buyData?.hash,
    onSuccess: () => {
      toast.success(`Successfully bought ${ticketCount} ticket(s)!`);
      setShowBuyDialog(false);
      setTicketCount('1');
      refetchInfo();
    },
    onError: (error) => {
      toast.error('Transaction failed: ' + error.message);
    },
  });

  const { write: endLottery, isLoading: isEnding } = useContractWrite({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'endLottery',
    onSuccess: () => {
      toast.success('Lottery ending initiated!');
    },
    onError: (error) => {
      toast.error('Failed to end lottery: ' + error.message);
    },
  });

  const { write: withdrawWinnings, isLoading: isWithdrawing } = useContractWrite({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'withdrawWinnings',
    onSuccess: () => {
      toast.success('Winnings withdrawn successfully!');
    },
    onError: (error) => {
      toast.error('Failed to withdraw: ' + error.message);
    },
  });

  useEffect(() => {
    if (!lotteryInfo) return;

    const updateTimer = () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const end = lotteryInfo.endTime;

      if (now >= end) {
        setTimeRemaining('Lottery Ended');
        return;
      }

      const diff = Number(end - now);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lotteryInfo]);

  const handleBuyTickets = () => {
    if (!lotteryInfo) return;
    const tickets = BigInt(ticketCount);
    const totalCost = lotteryInfo.ticketPrice * tickets;
    buyTickets({ args: [tickets], value: totalCost });
  };

  const getLotteryStateText = (state: number) => {
    switch (state) {
      case 0: return 'Closed';
      case 1: return 'Open';
      case 2: return 'Calculating Winner';
      default: return 'Unknown';
    }
  };

  const getLotteryStateColor = (state: number) => {
    switch (state) {
      case 0: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 1: return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 2: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // -------------------------------------------------------------
  // ERROR & LOADING STATES
  // -------------------------------------------------------------

  if (isLotteryError) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center">
        <div className="text-red-400 text-xl font-bold mb-2">Error Loading Lottery</div>
        <p className="text-gray-400 mb-4">Please check your network connection (Sepolia/Mainnet).</p>
        {lotteryError && <div className="text-xs font-mono bg-black/30 p-2 rounded mb-4 text-red-300">{lotteryError.message}</div>}
        <button onClick={() => refetchInfo()} className="px-6 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (isLotteryLoading && !lotteryInfo) {
    return (
      <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <div className="text-gray-400 animate-pulse">Loading Blockchain Data...</div>
      </div>
    );
  }

  if (!lotteryInfo) return null;

  // -------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-3xl overflow-hidden relative"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Icons.Casino />
                <h2 className="text-2xl font-bold text-white">Lottery #{lotteryInfo.lotteryId.toString()}</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLotteryStateColor(lotteryInfo.state)}`}>
                {getLotteryStateText(lotteryInfo.state)}
              </span>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Prize Pool */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-cyan-400 mb-2 font-medium">
                  <Icons.Money /> Prize Pool
                </div>
                <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  {formatEther(lotteryInfo.prizePool)} <span className="text-lg text-gray-400">ETH</span>
                </div>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-pink-400 mb-2 font-medium">
                  <Icons.Timer /> Time Remaining
                </div>
                <div className={`text-4xl lg:text-5xl font-bold tracking-tight ${timeRemaining === 'Lottery Ended' ? 'text-red-400' : 'text-white'}`}>
                  {timeRemaining || 'Loading...'}
                </div>
              </div>
            </div>

            {/* Ticket Price */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Icons.Ticket /> Ticket Price
              </div>
              <div className="text-2xl font-semibold text-white">
                {formatEther(lotteryInfo.ticketPrice)} ETH
              </div>
            </div>

            {/* Total Tickets */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Icons.Groups /> Tickets Sold
              </div>
              <div className="text-2xl font-semibold text-white">
                {lotteryInfo.totalTickets.toString()}
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

          {/* User Stats & Actions */}
          <div className="space-y-6">
            {isConnected && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Icons.Wallet />
                  <span className="text-purple-200">Your Tickets</span>
                </div>
                <span className="text-2xl font-bold text-white">{playerTickets?.toString() || '0'}</span>
              </div>
            )}

            {recentWinner && recentWinner !== '0x0000000000000000000000000000000000000000' && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                <Icons.Trophy />
                <div>
                  <div className="text-green-400 font-bold text-sm uppercase tracking-wider mb-1">Recent Winner</div>
                  <div className="font-mono text-sm break-all text-white/80">{recentWinner as string}</div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {lotteryInfo.state === 1 && (
                <button
                  onClick={() => setShowBuyDialog(true)}
                  disabled={!isConnected || timeRemaining === 'Lottery Ended'}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                >
                  Buy Tickets
                </button>
              )}

              {timeRemaining === 'Lottery Ended' && lotteryInfo.state === 1 && (
                <button
                  onClick={() => endLottery?.()}
                  disabled={isEnding}
                  className="flex-1 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold py-4 px-8 rounded-xl transition-all"
                >
                  {isEnding ? 'Ending...' : 'End Lottery'}
                </button>
              )}

              <button
                onClick={() => withdrawWinnings?.()}
                disabled={!isConnected || isWithdrawing}
                className="flex-1 border border-white/10 hover:bg-white/5 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Winnings'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Buy Dialog Modal */}
      <AnimatePresence>
        {showBuyDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowBuyDialog(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-md p-6 rounded-3xl relative z-10 border border-white/20 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Buy Tickets</h3>

              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Number of Tickets</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {lotteryInfo && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl mb-6">
                  <div className="text-cyan-400 text-sm uppercase tracking-wider mb-1">Total Cost</div>
                  <div className="text-xl font-bold text-white">
                    {formatEther(lotteryInfo.ticketPrice * BigInt(ticketCount || '0'))} ETH
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBuyDialog(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuyTickets}
                  disabled={isBuying || isConfirming || !ticketCount || Number(ticketCount) < 1}
                  className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isBuying || isConfirming ? 'Processing...' : 'Confirm Buy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LotteryCard;