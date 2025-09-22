import React, { useState, useEffect } from 'react';
import './styles.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Gaps from './Gaps';
import RiskScore from './RiskScore';
import Login from './Login';
import { useBodyClass } from './useBodyClass';
import Settings from './Settings';
import Dashboard from './Dashboard';



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  useBodyClass('sidebar-open', isLoggedIn);
  
  // The main useEffect that runs on initial load and handles login status
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/gaps" element={<Gaps />} />
      <Route path="/risk" element={<RiskScore />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;