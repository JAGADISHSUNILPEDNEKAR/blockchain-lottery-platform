import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Timer,
  EmojiEvents,
  ConfirmationNumber,
  Groups,
  LocalAtm,
  Casino,
} from '@mui/icons-material';
import { useContractRead, useContractWrite, useAccount, useWaitForTransaction } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LOTTERY_ABI, LOTTERY_ADDRESS } from '../utils/contracts';

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

  // Read lottery info
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

  // Read player ticket count
  const { data: playerTickets } = useContractRead({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getPlayerTicketCount',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Read recent winner
  const { data: recentWinner } = useContractRead({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'recentWinner',
    watch: true,
  });

  // Buy tickets transaction
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

  // End lottery transaction
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

  // Withdraw winnings
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

  // Update time remaining
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

    buyTickets({
      args: [tickets],
      value: totalCost,
    });
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
      case 0: return 'default';
      case 1: return 'success';
      case 2: return 'warning';
      default: return 'default';
    }
  };

  useEffect(() => {
    if (isLotteryError && lotteryError) {
      console.error("Error fetching lottery info:", lotteryError);
    }
  }, [isLotteryError, lotteryError]);

  if (isLotteryError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Error Loading Lottery</Typography>
            <Typography variant="body2">
              Failed to load lottery information. Please make sure you are on the correct network (Sepolia/Mainnet) and try again.
            </Typography>
            {lotteryError && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', fontFamily: 'monospace' }}>
                {lotteryError.message}
              </Typography>
            )}
          </Alert>
          <Button variant="outlined" onClick={() => refetchInfo()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLotteryLoading && !lotteryInfo) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading lottery information...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!lotteryInfo) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            <Typography>No lottery information available.</Typography>
          </Alert>
          <Button variant="outlined" onClick={() => refetchInfo()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Casino fontSize="large" />
                Lottery #{lotteryInfo.lotteryId.toString()}
              </Typography>
              <Chip
                label={getLotteryStateText(lotteryInfo.state)}
                color={getLotteryStateColor(lotteryInfo.state) as any}
                sx={{ mb: 2 }}
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    <LocalAtm sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Prize Pool
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {formatEther(lotteryInfo.prizePool)} ETH
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <ConfirmationNumber sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Ticket Price
                  </Typography>
                  <Typography variant="h5">
                    {formatEther(lotteryInfo.ticketPrice)} ETH
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Timer sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Time Remaining
                  </Typography>
                  <Typography variant="h5" color={timeRemaining === 'Lottery Ended' ? 'error' : 'inherit'}>
                    {timeRemaining || 'Loading...'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Total Tickets Sold
                  </Typography>
                  <Typography variant="h5">
                    {lotteryInfo.totalTickets.toString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {isConnected && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <AccountBalanceWallet sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Your Tickets
                </Typography>
                <Typography variant="h4" color="primary">
                  {playerTickets?.toString() || '0'}
                </Typography>
              </Box>
            )}

            {recentWinner && recentWinner !== '0x0000000000000000000000000000000000000000' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle1">
                  <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Winner: {recentWinner as string}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {lotteryInfo.state === 1 && (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setShowBuyDialog(true)}
                    disabled={!isConnected || timeRemaining === 'Lottery Ended'}
                    sx={{ flex: 1, minWidth: 200 }}
                  >
                    Buy Tickets
                  </Button>
                  {timeRemaining === 'Lottery Ended' && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => endLottery?.()}
                      disabled={isEnding}
                      sx={{ flex: 1, minWidth: 200 }}
                    >
                      {isEnding ? 'Ending...' : 'End Lottery'}
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="outlined"
                size="large"
                onClick={() => withdrawWinnings?.()}
                disabled={!isConnected || isWithdrawing}
                sx={{ flex: 1, minWidth: 200 }}
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Winnings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Buy Tickets Dialog */}
      <Dialog open={showBuyDialog} onClose={() => setShowBuyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Buy Lottery Tickets</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Number of Tickets"
              type="number"
              value={ticketCount}
              onChange={(e) => setTicketCount(e.target.value)}
              fullWidth
              inputProps={{ min: 1, max: 100 }}
              sx={{ mb: 2 }}
            />
            {lotteryInfo && (
              <Alert severity="info">
                Total Cost: {formatEther(lotteryInfo.ticketPrice * BigInt(ticketCount || '0'))} ETH
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBuyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBuyTickets}
            disabled={isBuying || isConfirming || !ticketCount || Number(ticketCount) < 1}
          >
            {isBuying || isConfirming ? 'Processing...' : 'Buy Tickets'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LotteryCard;