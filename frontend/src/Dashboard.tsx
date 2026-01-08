import React, { useState, useEffect, useMemo } from 'react';
import Chart from './Chart';
import Layout from './components/Layout';
import Grid from './components/Grid';
import { fetchWithAuth } from './api';
import { useNavigate } from 'react-router-dom';

// Define a type for the data you expect from the API.
interface ChartData {
  date: string;
  percentage: number;
  insurance: string;
}
// earnings data types and state removed - not used in current UI

interface metricData {
  date: string;
  diabetes: number;
  blood_pressure: number;
  breast_cancer: number;
  colo_cancer: number;
}

const Dashboard: React.FC = () => {
  const [gapsChartData, setGapsChartData] = useState<ChartData[]>([]);
  const [riskChartData, setRiskChartData] = useState<ChartData[]>([]);
  // earningsData is not currently used in the UI; remove to avoid unused variable warnings
  const [outreachChartData, setOutreachChartData] = useState<ChartData[]>([]);
  const [metricGapsData, setMetricGapsData] = useState<metricData[]>([]);
  
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
      const metricGapsPromise = fetchWithAuth('/api/chart-data/priority-gaps', {}, navigate);

      const [gapsResponse, riskResponse, earningsResponse, outreachResponse, metricGapsResponse] = await Promise.all([
        gapsPromise,
        riskPromise,
        earningsPromise,
        outreachPromise,
        metricGapsPromise,
      ]);

      const [gapsData, riskData, /* earningsData */, outreachData, metricGapsData] = await Promise.all([
        gapsResponse.json(),
        riskResponse.json(),
        earningsResponse.json(),
        outreachResponse.json(),
        metricGapsResponse.json(),
      ]);

  setGapsChartData(gapsData);
  setMetricGapsData(metricGapsData);
  setRiskChartData(riskData);
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

  // Helper function to convert wide-format metric data to long format for charting
    const toLongFormat = (rows: metricData[]) => {
    const out: Array<{ date: string; metric: string; value: number }> = [];
    if (!Array.isArray(rows)) return out;
    rows.forEach(r => {
      const date = r.date;
      out.push({ date, metric: 'Diabetees', value: Number(r.diabetes) || 0 });
      out.push({ date, metric: 'Blood Pressure', value: Number((r as any).blood_pressure) || 0 });
      out.push({ date, metric: 'Breast Cancer', value: Number((r as any).breast_cancer) || 0 });
      out.push({ date, metric: 'Colorectal Cancer', value: Number((r as any).colo_cancer) || 0 });
    });
    return out;
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, [navigate]);

  const memoMetricGapsLong = useMemo(() => toLongFormat(metricGapsData), [metricGapsData]);

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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Grid>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%' }}>
              <h4>Insurance Care Gap Closure Over Time</h4>
              <Chart id="careGapChart" data={gapsChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line' />
            </div>
          </div>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%' }}>
              <h4>Patient Outreach Over Time</h4>
              <Chart id="outreachChart" data={outreachChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line' />
            </div>
          </div>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%' }}>
              <h4>Risk Score Over Time</h4>
              <Chart id="riskScoreChart" data={riskChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={70} graphType='line' />
            </div>
          </div>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%' }}>
              <h4>Priority Metric Closures Over Time</h4>
              <Chart id="metricGapsChart" data={memoMetricGapsLong} xColumn="date" yColumn="value" groupColumn="metric" graphType='line'/>
            </div>
          </div>
        </Grid>
        <div className="dashboard-copyright">
          © {new Date().getFullYear()} Naples Comprehensive Health. All rights reserved.
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;