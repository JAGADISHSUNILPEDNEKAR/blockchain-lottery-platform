import React from 'react';
import { Container, Box, Typography, Paper, Grid, Button, CircularProgress, Chip, IconButton } from '@mui/material';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { formatEther } from 'viem';
import { BINGO_ADDRESS, BINGO_ABI } from '../utils/contracts';
import { toast } from 'react-hot-toast';
import RefreshIcon from '@mui/icons-material/Refresh';

// Enums and Interfaces
enum GameState {
    WAITING = 0,
    ACTIVE = 1,
    DRAWING = 2,
    ENDED = 3
}

interface BingoCardProps {
    numbers: number[];
    marked: boolean[];
    cardId: bigint;
    onMark: (cardId: bigint, number: number) => void;
    onClaim: (cardId: bigint) => void;
    isClaiming: boolean;
}

const BingoCard: React.FC<BingoCardProps> = ({ numbers, marked, cardId, onMark, onClaim, isClaiming }) => {
    return (
        <Paper sx={{ p: 2, bgcolor: '#0F0F0F', border: '1px solid #E50914' }}>
            <Typography variant="h6" gutterBottom align="center">Card #{cardId.toString()}</Typography>
            <Grid container spacing={1} sx={{ maxWidth: 300, mx: 'auto' }}>
                {numbers.map((num, i) => (
                    <Grid item xs={2.4} key={i}>
                        <Box
                            onClick={() => !marked[i] && onMark(cardId, num)}
                            sx={{
                                aspectRatio: '1/1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: marked[i] ? '#E50914' : '#262626',
                                color: marked[i] ? 'white' : '#9ca3af',
                                borderRadius: 1,
                                cursor: marked[i] ? 'default' : 'pointer',
                                '&:hover': {
                                    bgcolor: marked[i] ? '#E50914' : '#404040',
                                },
                                fontWeight: 'bold'
                            }}
                        >
                            {num}
                        </Box>
                    </Grid>
                ))}
            </Grid>
            <Button
                variant="contained"
                color="secondary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => onClaim(cardId)}
                disabled={isClaiming}
            >
                {isClaiming ? "Claiming..." : "BINGO!"}
            </Button>
        </Paper>
    );
};

const BingoGame: React.FC = () => {
    const { address, isConnected } = useAccount();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentGameId } = useContractRead({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'currentGameId',
        watch: true,
    }) as { data: bigint };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: gameInfo, refetch: refetchGameInfo } = useContractRead({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'getGameInfo',
        args: [currentGameId || BigInt(0)],
        enabled: !!currentGameId,
        watch: true,
    }) as { data: any, refetch: any, isLoading: boolean };

    const { isError: isGameError } = useContractRead({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'getGameInfo',
        args: [currentGameId || BigInt(0)],
        enabled: !!currentGameId,
        watch: true,
    });

    if (isGameError) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" color="error">Error loading game data. Please check your network connection.</Typography>
                <Button onClick={() => refetchGameInfo()}>Retry</Button>
            </Container>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: drawnNumbers, refetch: refetchDrawnNumbers } = useContractRead({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'getDrawnNumbers',
        args: [currentGameId || BigInt(0)],
        enabled: !!currentGameId,
        watch: true,
    }) as { data: readonly number[], refetch: any };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: playerCardIds, refetch: refetchPlayerCards } = useContractRead({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'getPlayerCards',
        args: [address!, currentGameId || BigInt(0)],
        enabled: !!address && !!currentGameId,
        watch: true,
    }) as { data: readonly bigint[], refetch: any };

    const { data: cardPrice } = useContractRead({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'cardPrice',
    });

    // Contract Writes
    const { write: buyCard, data: buyCardData } = useContractWrite({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'buyCard',
    });

    const { write: markNumber, data: markNumberData } = useContractWrite({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'markNumber',
    });

    const { write: claimBingo, data: claimBingoData } = useContractWrite({
        address: BINGO_ADDRESS,
        abi: BINGO_ABI,
        functionName: 'claimBingo',
    });

    // Waiters
    const { isLoading: isBuying } = useWaitForTransaction({
        hash: buyCardData?.hash,
        onSuccess: () => { toast.success('Card Purchased!'); refetchPlayerCards(); }
    });
    useWaitForTransaction({
        hash: markNumberData?.hash,
        onSuccess: () => { toast.success('Number Marked!'); refetchCards(); }
    });
    const { isLoading: isClaiming } = useWaitForTransaction({
        hash: claimBingoData?.hash,
        onSuccess: () => { toast.success('Bingo Claimed! Winner!'); }
    });

    const handleBuyCard = () => {
        if (!buyCard || !cardPrice) return;
        try {
            buyCard({ value: cardPrice });
        } catch (error) {
            console.error(error);
            toast.error('Failed to buy card');
        }
    };

    // Component to fetch individual card details
    const CardFetcher: React.FC<{ cardId: bigint }> = ({ cardId }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cardDetails } = useContractRead({
            address: BINGO_ADDRESS,
            abi: BINGO_ABI,
            functionName: 'getCardDetails',
            args: [currentGameId || BigInt(0), cardId],
            watch: true,
        }) as { data: [readonly number[], readonly boolean[], string] };

        // Expose refetch to parent via effect or context if needed, but watch: true handles most updates
        // For optimisitc UI updates after marking, we might triggers refetch.
        // But for MVP, watch defaults are okay.

        // This is a bit of a hack to get refetchCards working for the "Marked" toast callback above.
        // Ideally we structure data fetching differently. 
        // For now, relies on watch interval or manual refresh.

        if (!cardDetails) return <CircularProgress />;

        // cardDetails: [numbers (uint8[25]), marked (bool[25]), owner]
        const numbers = cardDetails[0].map(n => Number(n)); // Convert to number
        const marked = [...cardDetails[1]]; // Clone readonly array

        return (
            <BingoCard
                numbers={numbers}
                marked={marked}
                cardId={cardId}
                onMark={(id, num) => markNumber?.({ args: [id, num] })}
                onClaim={(id) => claimBingo?.({ args: [id] })}
                isClaiming={isClaiming}
            />
        );
    };

    // Helper to refresh all cards - trickier with individual component fetches.
    // For now, we just define a no-op or rely on the `watch` param.
    const refetchCards = () => {
        // Trigger re-renders or refetch manually if we lifted state up.
        // With `watch: true`, it should update on next block.
    };

    if (!isConnected) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h4">Please connect your wallet to play Bingo</Typography>
            </Container>
        );
    }

    // Game Info Parsing
    // getGameInfo returns: [state, startTime, pool, totalPlayers, numbersDrawnCount]
    const state = gameInfo ? gameInfo[0] : 0;
    const pool = gameInfo ? gameInfo[2] : BigInt(0);
    const drawnNumsList = drawnNumbers ? drawnNumbers.map(n => Number(n)) : [];

    const isWaiting = state === GameState.WAITING;

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                    Crypto Bingo
                </Typography>

                <Grid container spacing={4}>
                    {/* Game Status Panel */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, bgcolor: 'rgba(15, 15, 15, 0.9)', backdropFilter: 'blur(10px)', height: '100%', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
                            <Typography variant="h5" gutterBottom>Game Status</Typography>
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    label={
                                        state === GameState.WAITING ? "Waiting for Players" :
                                            state === GameState.ACTIVE ? "Game Active" :
                                                state === GameState.DRAWING ? "Drawing Number..." : "Ended"
                                    }
                                    color={state === GameState.ACTIVE ? "success" : "default"}
                                />
                            </Box>
                            <Typography>Prize Pool: {formatEther(pool)} ETH</Typography>
                            <Typography>Card Price: {cardPrice ? formatEther(cardPrice) : '0'} ETH</Typography>

                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6" gutterBottom>Drawn Numbers</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {drawnNumsList.map((num, i) => (
                                        <Chip key={i} label={num} color="primary" size="small" />
                                    ))}
                                    {drawnNumsList.length === 0 && <Typography color="text.secondary">No numbers drawn yet.</Typography>}
                                </Box>
                            </Box>

                            {isWaiting && (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    sx={{ mt: 4 }}
                                    onClick={handleBuyCard}
                                    disabled={isBuying}
                                >
                                    {isBuying ? "Buying..." : "Buy Card"}
                                </Button>
                            )}
                        </Paper>
                    </Grid>

                    {/* Cards Grid */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3, bgcolor: 'transparent' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5">Your Cards</Typography>
                                <IconButton onClick={() => { refetchPlayerCards(); refetchGameInfo(); refetchDrawnNumbers(); }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Box>

                            <Grid container spacing={3}>
                                {playerCardIds && playerCardIds.map((id: bigint) => (
                                    <Grid item xs={12} md={6} key={id.toString()}>
                                        <CardFetcher cardId={id} />
                                    </Grid>
                                ))}
                                {(!playerCardIds || playerCardIds.length === 0) && (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(15, 15, 15, 0.9)', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
                                            <Typography>You don't have any cards yet.</Typography>
                                            {isWaiting && <Typography>Buy one to join the game!</Typography>}
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default BingoGame;
