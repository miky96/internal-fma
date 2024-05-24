import React from 'react';
import { Box } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="80vh"
    >
      <img src="/logo.jpeg" alt="Logo" style={{ maxWidth: '100%', height: 'auto' }} />
    </Box>
  );
}

export default Home;