import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar: React.FC = () => {
    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)' }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Blockchain Lottery
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button color="inherit" component={RouterLink} to="/">
                        Home
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/lottery">
                        Lottery
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/games">
                        Games
                    </Button>
                    <ConnectButton />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
