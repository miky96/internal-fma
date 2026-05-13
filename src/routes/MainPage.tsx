import React, { useContext } from 'react';
import {
  AppShell, Burger, Drawer, NavLink, Stack, Container, Box, Group,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  Route, Routes, useNavigate, useLocation,
} from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Inventory from './Inventory';
import AddTicket from './AddTicket';
import ViewTickets from './ViewTickets';
import EditProduct from './EditProduct';
import Stats from './Stats';

const MainPage: React.FC = () => {
  const [drawerOpen, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const navigate = useNavigate();
  const { signOut, currentUser } = useContext(AuthContext);
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  const isAdmin = currentUser?.email === 'adminfma@gmail.com';
  const isInventari = currentUser?.email === 'inventarifma@gmail.com' || isAdmin;
  const isEconomia = currentUser?.email === 'economiafma@gmail.com' || isInventari;

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={drawerOpen} onClick={openDrawer} aria-label="menu" />
        </Group>
      </AppShell.Header>

      <Drawer
        opened={drawerOpen}
        onClose={closeDrawer}
        title="Menú"
        size={260}
        position="left"
        transitionProps={{ duration: 80 }}
        overlayProps={{ backgroundOpacity: 0.35 }}
      >
        <Stack gap={0}>
          <NavLink label="Pàgina principal" onClick={() => handleNavigation('/mainpage')} />
          {isInventari && (
            <NavLink label="Inventari" onClick={() => handleNavigation('inventory')} />
          )}
          <NavLink label="Afegir Tickets" onClick={() => handleNavigation('add-ticket')} />
          {isEconomia && (
            <NavLink label="Veure Tickets" onClick={() => handleNavigation('view-ticket')} />
          )}
          {isEconomia && (
            <NavLink label="Estadístiques" onClick={() => handleNavigation('stats')} />
          )}
          {isAdmin && (
            <NavLink label="Editar Productes" onClick={() => handleNavigation('edit-product')} />
          )}
          <NavLink label="Log Out" onClick={() => signOut()} />
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Container size="lg">
          <Routes>
            <Route path="inventory" element={<Inventory />} />
            <Route path="add-ticket" element={<AddTicket />} />
            <Route path="view-ticket" element={<ViewTickets />} />
            <Route path="stats" element={<Stats />} />
            <Route path="edit-product" element={<EditProduct />} />
          </Routes>
        </Container>
        {location.pathname === '/mainpage' && (
          <Box
            style={{
              display: 'flex',
              minHeight: '80vh',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px 16px',
            }}
          >
            <img
              src="/logo.jpeg"
              alt="Logo"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>
        )}
      </AppShell.Main>
    </AppShell>
  );
};

export default MainPage;
