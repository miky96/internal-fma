import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Estils base de Mantine. Cal carregar-los abans del primer render.
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      <Notifications position="bottom-center" />
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </MantineProvider>
  </React.StrictMode>,
);
