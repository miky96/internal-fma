import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { MantineProvider, createTheme, DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Estils base de Mantine. Cal carregar-los abans del primer render.
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

// Tema refinat: paleta consistent, radius més suau i ombres lleus.
// No introduïm cap dependència nova; només polim els valors per defecte.
const theme = mergeMantineTheme(
  DEFAULT_THEME,
  createTheme({
    primaryColor: 'indigo',
    defaultRadius: 'md',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    headings: {
      fontWeight: '700',
    },
    components: {
      Paper: {
        defaultProps: {
          shadow: 'xs',
          radius: 'md',
        },
      },
      Button: {
        defaultProps: {
          radius: 'md',
        },
      },
      Modal: {
        defaultProps: {
          radius: 'md',
          overlayProps: { backgroundOpacity: 0.45, blur: 2 },
          centered: true,
        },
      },
    },
  }),
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="bottom-center" />
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </MantineProvider>
  </React.StrictMode>,
);
