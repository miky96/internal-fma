import React, { Suspense, lazy, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { AuthContext } from './context/AuthContext';
import Home from './routes/Home';

// MainPage i les seves rutes filles són pesades; només es carreguen un cop
// l'usuari està autenticat, deixant Home (login) en el chunk inicial.
const MainPage = lazy(() => import('./routes/MainPage'));

const RouteFallback: React.FC = () => (
  <Center h="80vh">
    <Loader />
  </Center>
);

// Routing 100% declaratiu: cada ruta decideix què renderitza segons currentUser.
// Evitem els useEffect imperatius amb navigate() que reaccionaven a canvis
// d'identitat de l'objecte User (p. ex. token refresh) i feien rebotar la URL.
const App = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          index
          element={currentUser ? <Navigate to="/mainpage" replace /> : <Home />}
        />
        <Route
          path="mainpage/*"
          element={currentUser ? <MainPage /> : <Home />}
        />
      </Routes>
    </Suspense>
  );
};

export default App;
