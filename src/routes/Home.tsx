import React, { ChangeEvent, FormEvent, useState } from 'react';

import {
  Box, Button, TextField, Snackbar, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInUser } from '../firebase/firebase';
import '../App.css';

const defaultFormFields = {
  email: '',
  password: '',
};

const Home = () => {
  const [formFields, setFormFields] = useState(defaultFormFields);
  const { email, password } = formFields;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigate = useNavigate();

  const resetFormFields = () => {
    setFormFields(defaultFormFields);
  };

  const handleSnackbarClose = (_reason?: string) => {
    if (_reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      // Send the email and password to firebase
      const result = await signInUser(email, password);

      if ('error' in result) {
        setSnackbarMessage(result.error);
        setSnackbarOpen(true);
      } else {
        resetFormFields();
        navigate('/mainpage');
      }
    } catch (error: any) {
      console.error('El login ha fallat', error.message);
      setSnackbarMessage(error.message);
      setSnackbarOpen(true);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormFields({ ...formFields, [name]: value });
  };

  return (
    <div className="App">
      <div className="card">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            '& .MuiTextField-root': { m: 1, width: '25ch' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextField
            type="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="Email"
            required
            label="Email"
            variant="outlined"
          />
          <TextField
            type="password"
            name="password"
            value={password}
            onChange={handleChange}
            autoComplete="password"
            placeholder="Contrassenya"
            required
            label="Contrassenya"
            variant="outlined"
          />
          <Button
            id="recaptcha"
            type="submit"
            variant="contained"
            color="primary"
            sx={{ m: 1 }}
          >
            Entrar
          </Button>
        </Box>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={(_, reason) => handleSnackbarClose(reason)}
      >
        <Alert onClose={() => handleSnackbarClose()} severity="error" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Home;
