import React, { ChangeEvent, FormEvent, useState } from 'react';
import {
  Box, Button, TextInput, PasswordInput, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
  const navigate = useNavigate();

  const resetFormFields = () => {
    setFormFields(defaultFormFields);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await signInUser(email, password);
      if (result && 'error' in result) {
        notifications.show({ color: 'red', message: result.error });
      } else {
        resetFormFields();
        navigate('/mainpage');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconegut';
      console.error('El login ha fallat', message);
      notifications.show({ color: 'red', message });
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormFields({ ...formFields, [name]: value });
  };

  return (
    <div className="App">
      <div className="card">
        <Box component="form" onSubmit={handleSubmit} maw={320} mx="auto">
          <Stack gap="sm">
            <TextInput
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="Email"
              required
              label="Email"
            />
            <PasswordInput
              name="password"
              value={password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Contrassenya"
              required
              label="Contrassenya"
            />
            <Button id="recaptcha" type="submit" color="blue">
              Entrar
            </Button>
          </Stack>
        </Box>
      </div>
    </div>
  );
};

export default Home;
