import React, { Suspense, lazy, useContext } from 'react';
import {
  AppShell, Burger, Drawer, NavLink, Stack, Container, Box, Group, Center, Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  Route, Routes, useNavigate, useLocation,
} from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Code-splitting per ruta: cada vista es carrega només quan l'usuari hi navega.
// Això redueix dràsticament el chunk inicial després del login, sobretot per
// l'usuari "base" que només afegeix tickets i no necessita Stats, Inventory, etc.
// La SDK de Firestore també queda fora del chunk inicial perquè només
// l'importen aquestes rutes lazy.
const Inventory = lazy(() => import('./Inventory'));
const AddTicket = lazy(() => import('./AddTicket'));
const ViewTickets = lazy(() => import('./ViewTickets'));
const EditProduct = lazy(() => import('./EditProduct'));
const Stats = lazy(() => import('./Stats'));

const RouteFallback: React.FC = () => (
  <Center mih="50vh">
    <Loader />
  </Center>
);

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
  const isEconomia = currentUser?.email === 'economiafma@gmail.com' || isAdmin;
  // Rol "tickets" (ticketsfma@gmail.com): compte dedicat que només registra
  // vendes. Sense permisos addicionals, veu únicament "Afegir Tickets", igual
  // que qualsevol usuari base.

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
          {isEconomia && (
            <NavLink label="Editar Productes" onClick={() => handleNavigation('edit-product')} />
          )}
          <NavLink label="Log Out" onClick={() => signOut()} />
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Container size="lg">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="inventory" element={<Inventory />} />
              <Route path="add-ticket" element={<AddTicket />} />
              <Route path="view-ticket" element={<ViewTickets />} />
              <Route path="stats" element={<Stats />} />
              <Route path="edit-product" element={<EditProduct />} />
            </Routes>
          </Suspense>
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
