import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import LotteryCard from '../components/LotteryCard';

const LotteryPage: React.FC = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                    Decentralized Lottery
                </Typography>
                <LotteryCard />
            </Box>
        </Container>
    );
};

export default LotteryPage;
