import React from 'react';
import { Box, Typography, Button, Container, Grid, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Casino, SportsEsports } from '@mui/icons-material';

const HomePage: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #6366f1, #8b5cf6)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Blockchain Lottery & Gaming
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 6 }}>
                    Fair, transparent, and decentralized gaming platform powered by Ethereum and Chainlink VRF
                </Typography>

                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, bgcolor: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                            <Casino sx={{ fontSize: 60, color: '#6366f1' }} />
                            <Typography variant="h5" fontWeight="bold">Lottery</Typography>
                            <Typography align="center" color="text.secondary">
                                Join our decentralized lottery. Buy tickets, wait for the draw, and win big!
                            </Typography>
                            <Button variant="contained" component={RouterLink} to="/lottery" size="large" sx={{ mt: 'auto' }}>
                                Play Lottery
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, bgcolor: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                            <SportsEsports sx={{ fontSize: 60, color: '#8b5cf6' }} />
                            <Typography variant="h5" fontWeight="bold">Games</Typography>
                            <Typography align="center" color="text.secondary">
                                Play Blackjack and Bingo with provably fair randomness.
                            </Typography>
                            <Button variant="contained" component={RouterLink} to="/games" size="large" sx={{ mt: 'auto' }}>
                                Play Games
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default HomePage;
