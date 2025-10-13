import React, { useState, useEffect } from 'react';
import Chart from './Chart';
import Layout from './Layout';
import Grid from './Grid';
import { fetchWithAuth } from './api';
import { useNavigate } from 'react-router-dom';

// Define a type for the data you expect from the API.
interface ChartData {
  date: string;
  percentage: number;
  insurance: string;
}
interface EarningsChartData {
  insurance: string;
  earnings: number;
}

const Dashboard: React.FC = () => {
  const [gapsChartData, setGapsChartData] = useState<ChartData[]>([]);
  const [riskChartData, setRiskChartData] = useState<ChartData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsChartData[]>([]);
  const [outreachChartData, setOutreachChartData] = useState<ChartData[]>([]);
  
  const [gapsLoading, setGapsLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(true);
  const [outreachLoading, setOutreachLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAllDashboardData = async () => {
    try {
      const gapsPromise = fetchWithAuth('/api/chart-data', {}, navigate);
      const riskPromise = fetchWithAuth('/api/chart-data/risk-score', {}, navigate);
      const earningsPromise = fetchWithAuth('/api/chart-data/earnings', {}, navigate);
      const outreachPromise = fetchWithAuth('/api/chart-data/outreach', {}, navigate);

      const [gapsResponse, riskResponse, earningsResponse, outreachResponse] = await Promise.all([
        gapsPromise,
        riskPromise,
        earningsPromise,
        outreachPromise,
      ]);

      const [gapsData, riskData, earningsData, outreachData] = await Promise.all([
        gapsResponse.json(),
        riskResponse.json(),
        earningsResponse.json(),
        outreachResponse.json(),
      ]);

      setGapsChartData(gapsData);
      setRiskChartData(riskData);
      setEarningsData(earningsData);
      setOutreachChartData(outreachData);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
      setError('Failed to load dashboard data.');
    } finally {
      setGapsLoading(false);
      setRiskLoading(false);
      setEarningsLoading(false);
      setOutreachLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, [navigate]);

   if (gapsLoading || riskLoading || earningsLoading || outreachLoading) {
  //if (true) {
    return (
      <Layout showHeader={true}>
      <div className="loading-container-dash">
        <div className="loading-box-dash">
          <p className="loading-text">Loading...</p>
        </div>
      </div>
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
    <Layout showHeader={true}>
      <Grid>
        <div className="card-white">
          <div style={{ width: '100%', height: '100%' }}>
            <h4>Insurance Care Gap Closure Over Time</h4>
            <Chart data={gapsChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line' />
          </div>
        </div>
        <div className="card-white">
          <div style={{ width: '100%', height: '100%' }}>
            <h4>Patient Outreach Over Time</h4>
            <Chart data={outreachChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line' />
          </div>
        </div>
        <div className="card-white">
          <div style={{ width: '100%', height: '100%' }}>
            <h4>Risk Score Over Time</h4>
            <Chart data={riskChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={70} graphType='line' />
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
  );
};

export default Dashboard;