import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    useMediaQuery,
    useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)' }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Blockchain Lottery
                </Typography>

                {isMobile ? (
                    <>
                        <Box sx={{ mr: 2 }}>
                            <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                        </Box>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleMenu}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleClose} component={RouterLink} to="/">Home</MenuItem>
                            <MenuItem onClick={handleClose} component={RouterLink} to="/lottery">Lottery</MenuItem>
                            <MenuItem onClick={handleClose} component={RouterLink} to="/games">Games</MenuItem>
                        </Menu>
                    </>
                ) : (
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
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
