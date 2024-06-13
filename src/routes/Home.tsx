import React from 'react';
import { ChangeEvent, FormEvent, useState } from 'react'
import { Box, Button, TextField } from '@mui/material';
import { signInUser } from '../firebase/firebase'
import { useNavigate } from 'react-router-dom'
import '.././App.css'

const defaultFormFields = {
  email: '',
  password: '',
}

function Home() {
  const [formFields, setFormFields] = useState(defaultFormFields)
  const { email, password } = formFields
  const navigate = useNavigate()

  const resetFormFields = () => {
    return (
      setFormFields(defaultFormFields)
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      // Send the email and password to firebase
      const userCredential = await signInUser(email, password)

      if (userCredential) {
        resetFormFields()
        navigate('/mainpage')
      }
    } catch (error: any) {
      console.log('Ha fallat el login', error.message);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormFields({ ...formFields, [name]: value })
  }

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
    </div>
  )
}

export default Home;