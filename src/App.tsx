import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Container, Drawer, List, ListItem, ListItemText, Box, ListItemButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import Home from './Home';
import Inventory from './Inventory';
import AddTicket from './AddTicket';
import ViewTickets from './ViewTickets';

const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          style={{ width: 250 }}
        >
          <List>
            <ListItemButton onClick={() => handleNavigation('/')}>
              <ListItemText primary="Pàgina principal" />
            </ListItemButton>
            <ListItemButton onClick={() => handleNavigation('/inventory')}>
              <ListItemText primary="Inventari" />
            </ListItemButton>
            <ListItemButton onClick={() => handleNavigation('/add-ticket')}>
              <ListItemText primary=" Afegir Tickets" />
            </ListItemButton>
            <ListItemButton onClick={() => handleNavigation('/view-ticket')}>
              <ListItemText primary="Veure Tickets" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/add-ticket" element={<AddTicket />} />
          <Route path="/view-ticket" element={<ViewTickets />} />
        </Routes>
      </Container>
    </div>
  );
};

export default App;