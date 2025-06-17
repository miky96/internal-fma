import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Container,
  Drawer,
  List,
  ListItemText,
  Box,
  ListItemButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Route, Routes, useNavigate, useLocation,
} from 'react-router-dom';
import Inventory from './Inventory';
import AddTicket from './AddTicket';
import ViewTickets from './ViewTickets';
import { AuthContext } from '../context/AuthContext';
import EditProduct from './EditProduct';

const MainPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, currentUser } = useContext(AuthContext);
  const location = useLocation();

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown'
      && ((event as React.KeyboardEvent).key === 'Tab'
        || (event as React.KeyboardEvent).key === 'Shift')
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
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          sx={{ width: 250 }}
        >
          <List>
            <ListItemButton onClick={() => handleNavigation('/mainpage')}>
              <ListItemText primary="Pàgina principal" />
            </ListItemButton>
            {(currentUser?.email === 'inventarifma@gmail.com'
              || currentUser?.email === 'adminfma@gmail.com') && (
                <ListItemButton onClick={() => handleNavigation('inventory')}>
                  <ListItemText primary="Inventari" />
                </ListItemButton>
            )}
            <ListItemButton onClick={() => handleNavigation('add-ticket')}>
              <ListItemText primary="Afegir Tickets" />
            </ListItemButton>
            {(currentUser?.email === 'inventarifma@gmail.com'
              || currentUser?.email === 'economiafma@gmail.com'
              || currentUser?.email === 'adminfma@gmail.com') && (
                <ListItemButton onClick={() => handleNavigation('view-ticket')}>
                  <ListItemText primary="Veure Tickets" />
                </ListItemButton>
            )}
            {(currentUser?.email === 'martafma@gmail.com'
              || currentUser?.email === 'adminfma@gmail.com') && (
                <ListItemButton onClick={() => handleNavigation('edit-product')}>
                  <ListItemText primary="Editar Productes" />
                </ListItemButton>
            )}
            <ListItemButton onClick={() => signOut()}>
              <ListItemText primary="Log Out" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      <Container>
        <Routes>
          <Route path="inventory" element={<Inventory />} />
          <Route path="add-ticket" element={<AddTicket />} />
          <Route path="view-ticket" element={<ViewTickets />} />
          <Route path="edit-product" element={<EditProduct />} />
        </Routes>
      </Container>
      {location.pathname === '/mainpage' && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
        >
          <img
            src="/logo.jpeg"
            alt="Logo"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      )}
    </div>
  );
};

export default MainPage;
