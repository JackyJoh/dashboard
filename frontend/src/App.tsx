import { useState, useEffect } from 'react';
import './styles.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './Layout'; // Ensure the correct path to Layout component
import Gaps from './Gaps';
import RiskScore from './RiskScore';
import Login from './Login';
import { useBodyClass } from './useBodyClass';
import Settings from './Settings';
import Dashboard from './Dashboard';
import Outreach from './Outreach';
import PriorityGaps from './PriorityGaps';



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useBodyClass('sidebar-open', isLoggedIn);
  
  // The main useEffect that runs on initial load and handles login status
  useEffect(() => {
    //localStorage.removeItem('auth_token');
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/');
  };
   if (loading) {
    return (
      <Layout showHeader={true}>
        <div className="loading-box">
          <p className="loading-text">Loading...</p>
        </div>
      </Layout>
    );
  }

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
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/gaps" element={<Gaps />} />
      <Route path="/priority" element={<PriorityGaps />} />
      <Route path="/risk" element={<RiskScore />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Dashboard />} />
      <Route path="/outreach" element={<Outreach />} />
    </Routes>
  );
}

export default App;