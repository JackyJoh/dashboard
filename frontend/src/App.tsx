import { useState, useEffect } from 'react';
import './styles.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Gaps from './Gaps';
import RiskScore from './RiskScore';
import Login from './Login';
import { useBodyClass } from './useBodyClass';
import Settings from './Settings';
import Dashboard from './Dashboard';
import Outreach from './Outreach';
import PriorityGaps from './PriorityGaps';
import ProtectedRoute from './ProtectedRoute';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  useBodyClass('sidebar-open', isLoggedIn);
  
  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/gaps" element={<ProtectedRoute><Gaps /></ProtectedRoute>} />
      <Route path="/priority" element={<ProtectedRoute><PriorityGaps /></ProtectedRoute>} />
      <Route path="/risk" element={<ProtectedRoute><RiskScore /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/outreach" element={<ProtectedRoute><Outreach /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;