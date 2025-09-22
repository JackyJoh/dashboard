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
import { fetchWithAuth } from './api';
import Settings from './Settings';

//Define a type for the data you expect from the API.
interface ChartData {
  date: string;
  percentage: number;
  insurance: string;
}
interface EarningsChartData {
  insurance: string;
  earnings: number;
}

function App() {
  const [gapsChartData, setGapsChartData] = useState<ChartData[]>([]);
  const [riskChartData, setRiskChartData] = useState<ChartData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsChartData[]>([]);
  
  const [gapsLoading, setGapsLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useBodyClass('sidebar-open', isLoggedIn);

  //fetches all dashboard data in parallel
  const fetchAllDashboardData = async () => {
    try {
      const gapsPromise = fetchWithAuth('/api/chart-data', {}, navigate);
      const riskPromise = fetchWithAuth('/api/chart-data/risk-score', {}, navigate);
      const earningsPromise = fetchWithAuth('/api/chart-data/earnings', {}, navigate);

      const [gapsResponse, riskResponse, earningsResponse] = await Promise.all([
        gapsPromise,
        riskPromise,
        earningsPromise,
      ]);

      const [gapsData, riskData, earningsData] = await Promise.all([
        gapsResponse.json(),
        riskResponse.json(),
        earningsResponse.json(),
      ]);

      setGapsChartData(gapsData);
      setRiskChartData(riskData);
      setEarningsData(earningsData);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
      setError('Failed to load dashboard data.');
    } finally {
      setGapsLoading(false);
      setRiskLoading(false);
      setEarningsLoading(false);
    }
  };

  //runs on initial load and handles login status
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
      fetchAllDashboardData();
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
                  <Chart data={riskChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={70} graphType='line'/>
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
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;