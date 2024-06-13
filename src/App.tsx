
import { useContext, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import Home from './routes/Home'
import MainPage from './routes/MainPage'

function App() {
  const { currentUser } = useContext(AuthContext)
  const navigate = useNavigate()

  // NOTE: console log for testing purposes
  console.log('User:', !!currentUser);

  // Check if the current user exists on the initial render.
  useEffect(() => {
    if (currentUser) {
      console.log(currentUser.email)
      navigate('/mainpage')
    }
  }, [currentUser])

  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="mainpage/*" element={currentUser ? <MainPage /> : <Home />} />
    </Routes>
  )
}

export default App;
