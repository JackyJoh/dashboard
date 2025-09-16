import React, { useState, useEffect } from 'react';
import Chart from './Chart';
import Layout from './Layout';
import Grid from './Grid';
import './styles.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Gaps from './Gaps';
import RiskScore from './RiskScore';
import Login from './Login';
import { useBodyClass } from './useBodyClass';

// Define a type for the data you expect from the API.
interface ChartData {
  date: string;
  percentage: number;
  insurance: string;
}
// NEW: Interface for the earnings data
interface EarningsChartData {
  insurance: string;
  earnings: number;
}

function App() {
  const [gapsChartData, setGapsChartData] = useState<ChartData[]>([]);
  const [riskChartData, setRiskChartData] = useState<ChartData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsChartData[]>([]); // NEW state for earnings

  
  const [gapsLoading, setGapsLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(true); // NEW loading state
  const [riskLoading, setRiskLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Use the custom hook to manage the 'sidebar-open' class on the body
  useBodyClass('sidebar-open', isLoggedIn);

  useEffect(() => {
    
    if (!isLoggedIn) return;

    fetch('/api/chart-data')
      .then(response => response.json())
      .then(data => setGapsChartData(data))
      .catch(error => {
        console.error('Failed to fetch gap chart data:', error);
        setError('Failed to load gap chart data.');
      })
      .finally(() => setGapsLoading(false));
  }, [isLoggedIn]);

  // NEW: useEffect for earnings data
  useEffect(() => {
    if (!isLoggedIn) return;
    
    fetch('/api/chart-data/earnings')
      .then(response => response.json())
      .then(data => setEarningsData(data))
      .catch(error => {
        console.error('Failed to fetch earnings data:', error);
        setError('Failed to load earnings data.');
      })
      .finally(() => setEarningsLoading(false));
  }, [isLoggedIn]);


  // Separate useEffect for the Risk Score chart data
  useEffect(() => {
    if (!isLoggedIn) return;

    fetch('/api/chart-data/risk-score')
      .then(response => response.json())
      .then(data => setRiskChartData(data))
      .catch(error => {
        console.error('Failed to fetch risk chart data:', error);
        setError('Failed to load risk chart data.');
      })
      .finally(() => setRiskLoading(false));
  }, [isLoggedIn]);

  // Handle login status and redirect
  useEffect(() => {
    //localStorage.removeItem('auth_token'); // For testing purposes, remove this line in production

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

  // Handle loading and error for the main dashboard
  if (gapsLoading || riskLoading || earningsLoading) {
    return (
      <Layout showHeader={true}>
        <div>Loading chart data...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showHeader={true}>
        <div>Error: {error}</div>
      </Layout>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout showHeader={true}>
            <Grid>
              <div className="card-white">
                <div style={{ width: '100%', height: '100%' }}>
                  <h4>Care Gap Closure Over Time</h4>
                  <Chart data={gapsChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line'/>
                </div>
              </div>
              <div className="card-green">
                <p className="text-xl font-semibold text-green-800">
                  <strong>Risk Score</strong>
                </p>
              </div>
              <div className="card-white">
                <div style={{ width: '100%', height: '100%' }}>
                  <h4>Risk Score Over Time</h4>
                  <Chart data={riskChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={70} graphType='bar'/>
                </div>
              </div>
              <div className="card-red">
                <div className="card-subgrid">
                  <div className="card-subgrid-item">
                    <p className="text-xl font-semibold text-red-800">
                      Insurance Pie Chart
                    </p>
                  </div>
                  <div className="card-subgrid-item">
                    <Chart data={earningsData} xColumn="insurance" yColumn="earnings" graphType='pie' />
                  </div>
                </div>
              </div>
            </Grid>
          </Layout>
        }
      />
      <Route path="/gaps" element={<Gaps />} />
      <Route path="/risk" element={<RiskScore />} />
    </Routes>
  );
}

export default App;