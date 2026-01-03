import React from 'react';
import { Container, Box, Typography, Grid, Paper, Button } from '@mui/material';

const GamesPage: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 6, fontWeight: 'bold' }}>
                    Casino Games
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 4, bgcolor: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                            <Typography variant="h4" gutterBottom>Blackjack</Typography>
                            <Typography paragraph color="text.secondary">
                                Play Blackjack against the smart contract dealer. Provably fair and transparent.
                            </Typography>
                            <Button variant="outlined" disabled>Coming Soon</Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 4, bgcolor: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                            <Typography variant="h4" gutterBottom>Bingo</Typography>
                            <Typography paragraph color="text.secondary">
                                Multiplayer Bingo with automated number drawing.
                            </Typography>
                            <Button variant="outlined" disabled>Coming Soon</Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default GamesPage;
