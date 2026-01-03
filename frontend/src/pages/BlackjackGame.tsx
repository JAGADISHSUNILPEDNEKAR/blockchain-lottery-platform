import React, { useState } from 'react';
import { Container, Box, Typography, Paper, Button, TextField, CircularProgress, Chip } from '@mui/material';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { BLACKJACK_ADDRESS, BLACKJACK_ABI } from '../utils/contracts';
import { toast } from 'react-hot-toast';

// Card interface based on struct in Solidity
interface Card {
    suit: number; // 0: Hearts, 1: Diamonds, 2: Clubs, 3: Spades
    rank: number; // 1-13
}

enum GameState {
    WAITING = 0,
    PLAYER_TURN = 1,
    DEALER_TURN = 2,
    ENDED = 3
}

const suitSymbols = ['♥', '♦', '♣', '♠'];
const suitColors = ['#E50914', '#E50914', '#000000', '#000000'];
const rankLabels = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardDisplay: React.FC<{ card: any; hidden?: boolean }> = ({ card, hidden }) => {
    if (hidden) {
        return (
            <Paper
                sx={{
                    width: 60,
                    height: 90,
                    bgcolor: '#7f1d1d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    border: '1px solid #991b1b',
                    backgroundImage: 'linear-gradient(135deg, #7f1d1d 25%, #991b1b 25%, #991b1b 50%, #7f1d1d 50%, #7f1d1d 75%, #991b1b 75%, #991b1b 100%)',
                    backgroundSize: '10px 10px'
                }}
            />
        );
    }

    return (
        <Paper
            sx={{
                width: 60,
                height: 90,
                bgcolor: 'white',
                color: suitColors[card.suit],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                position: 'relative',
                fontWeight: 'bold',
                fontSize: '1.2rem'
            }}
        >
            <Typography variant="body1" sx={{ textAlign: 'center' }}>
                {rankLabels[card.rank]}
                <br />
                <span style={{ fontSize: '1.5rem' }}>{suitSymbols[card.suit]}</span>
            </Typography>
        </Paper>
    );
};

const BlackjackGame: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [betAmount, setBetAmount] = useState<string>('0.01');

    // Read Game State
    const { data: gameState, refetch: refetchGameState, isError: isGameError } = useContractRead({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'getGameState',
        args: [address!],
        enabled: !!address,
        watch: true,
    }) as { data: any, refetch: any, isError: boolean };

    if (isGameError) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" color="error">Error loading game data. Please check your network connection.</Typography>
                <Button onClick={() => refetchGameState()}>Retry</Button>
            </Container>
        );
    }

    // Contract Writes
    const { write: startGame, data: startGameData } = useContractWrite({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'startGame',
    });

    const { write: hit, data: hitData } = useContractWrite({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'hit',
    });

    const { write: stand, data: standData } = useContractWrite({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'stand',
    });

    const { write: doubleDown, data: doubleDownData } = useContractWrite({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'doubleDown',
    });

    const { write: withdraw, data: withdrawData } = useContractWrite({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'withdraw',
    });

    // Transaction Waiters
    const { isLoading: isStarting } = useWaitForTransaction({
        hash: startGameData?.hash,
        onSuccess: () => { toast.success('Game Started!'); refetchGameState(); }
    });
    const { isLoading: isHitting } = useWaitForTransaction({
        hash: hitData?.hash,
        onSuccess: () => { toast.success('Hit!'); refetchGameState(); }
    });
    const { isLoading: isStanding } = useWaitForTransaction({
        hash: standData?.hash,
        onSuccess: () => { toast.success('Stood!'); refetchGameState(); }
    });
    const { isLoading: isDoubling } = useWaitForTransaction({
        hash: doubleDownData?.hash,
        onSuccess: () => { toast.success('Doubled Down!'); refetchGameState(); }
    });
    const { isLoading: isWithdrawing } = useWaitForTransaction({
        hash: withdrawData?.hash,
        onSuccess: () => { toast.success('Winnings Withdrawn!'); }
    });

    const handleStartGame = () => {
        if (!startGame) return;
        try {
            startGame({ value: parseEther(betAmount) });
        } catch (error) {
            console.error(error);
            toast.error('Failed to place bet');
        }
    };

    if (!isConnected) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h4">Please connect your wallet to play Blackjack</Typography>
            </Container>
        );
    }

    // gameState returns: [bet, playerTotal, dealerTotal, state, playerCards, dealerCards]
    // Note: Adjust indices based on actual ABI return structure if needed, but wagmi usually returns object or array based on ABI
    // Using simple checks assuming array return for now or object if named.
    // Based on ABI:
    // 0: bet
    // 1: playerTotal
    // 2: dealerTotal
    // 3: state
    // 4: playerCards
    // 5: dealerCards

    // Safely cast data if present
    const currentBet = gameState ? gameState[0] : BigInt(0);
    const playerTotal = gameState ? Number(gameState[1]) : 0;
    const dealerTotal = gameState ? Number(gameState[2]) : 0;
    const roundState = gameState ? gameState[3] : 0;
    const playerCards = gameState ? gameState[4] : [] as any[];
    const dealerCards = gameState ? gameState[5] : [] as any[];

    const isPlayerTurn = roundState === GameState.PLAYER_TURN;
    const isGameEnded = roundState === GameState.ENDED;
    const isWaiting = roundState === GameState.WAITING;

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                    Blackjack
                </Typography>

                <Paper sx={{ p: 4, bgcolor: 'rgba(15, 15, 15, 0.9)', backdropFilter: 'blur(10px)', minHeight: '60vh', border: '1px solid rgba(229, 9, 20, 0.2)' }}>

                    {/* Dealer Area */}
                    <Box sx={{ mb: 6, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>Dealer's Hand ({isGameEnded ? dealerTotal : '?'})</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            {dealerCards.map((card: Card, index: number) => (
                                <CardDisplay key={index} card={card} hidden={index === 1 && !isGameEnded} />
                            ))}
                            {dealerCards.length === 0 && Array.from({ length: 2 }).map((_, i) => (
                                <Paper key={i} sx={{ width: 60, height: 90, bgcolor: 'transparent', border: '2px dashed gray' }} />
                            ))}
                        </Box>
                    </Box>

                    {/* Game Status/Result */}
                    {isGameEnded && (
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Chip
                                label={
                                    playerTotal > 21 ? "BUST! You Lose" :
                                        dealerTotal > 21 ? "Dealer BUST! You Win!" :
                                            playerTotal > dealerTotal ? "You Win!" :
                                                playerTotal === dealerTotal ? "Push (Tie)" : "Dealer Wins"
                                }
                                color={playerTotal > 21 || (dealerTotal <= 21 && dealerTotal > playerTotal) ? "error" : "success"}
                                sx={{ fontSize: '1.5rem', py: 3, px: 2 }}
                            />
                            {/* Withdraw button if balance > 0? No, contract sends automatically or has withdraw function? 
                                Contract has withdraw function for manual withdrawal of balance
                            */}
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => withdraw?.()}
                                    disabled={isWithdrawing}
                                >
                                    {isWithdrawing ? "Withdrawing..." : "Withdraw Winnings"}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Player Area */}
                    <Box sx={{ mb: 6, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>Your Hand ({playerTotal})</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            {playerCards.map((card: Card, index: number) => (
                                <CardDisplay key={index} card={card} />
                            ))}
                            {playerCards.length === 0 && Array.from({ length: 2 }).map((_, i) => (
                                <Paper key={i} sx={{ width: 60, height: 90, bgcolor: 'transparent', border: '2px dashed gray' }} />
                            ))}
                        </Box>
                        {currentBet > BigInt(0) && (
                            <Typography variant="subtitle1" sx={{ mt: 2 }}>Bet: {formatEther(currentBet)} ETH</Typography>
                        )}
                    </Box>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {isWaiting || isGameEnded ? (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label="Bet Amount (ETH)"
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    sx={{ width: 150 }}
                                    inputProps={{ step: "0.001" }}
                                    disabled={isStarting}
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleStartGame}
                                    disabled={isStarting}
                                >
                                    {isStarting ? <CircularProgress size={24} /> : "Place Bet"}
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => hit?.()}
                                    disabled={!isPlayerTurn || isHitting || isStanding || isDoubling}
                                >
                                    Hit
                                </Button>
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={() => stand?.()}
                                    disabled={!isPlayerTurn || isHitting || isStanding || isDoubling}
                                >
                                    Stand
                                </Button>
                                <Button
                                    variant="contained"
                                    color="info"
                                    onClick={() => doubleDown?.({ value: currentBet })}
                                    disabled={!isPlayerTurn || playerCards.length !== 2 || isHitting || isStanding || isDoubling}
                                >
                                    Double Down
                                </Button>
                            </>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default BlackjackGame;
