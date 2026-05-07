import React, { useContext } from 'react';
import {
  AppShell, Burger, Drawer, NavLink, Stack, Container, Image, Box, Group,
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
  const isMarta = currentUser?.email === 'martafma@gmail.com' || isAdmin;

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
          {isMarta && (
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
            <Route path="edit-product" element={<EditProduct />} />
          </Routes>
        </Container>
        {location.pathname === '/mainpage' && (
          <Box display="flex" mih="80vh" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Image src="/logo.jpeg" alt="Logo" fit="contain" mah="80vh" />
          </Box>
        )}
      </AppShell.Main>
    </AppShell>
  );
};

export default MainPage;
