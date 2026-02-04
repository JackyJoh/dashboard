import React, { useMemo } from 'react';
import Chart from './Chart';
import Layout from './components/Layout';
import Grid from './components/Grid';
import { fetchWithAuth } from './api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Define a type for the data you expect from the API.
// interface ChartData {
//   date: string;
//   percentage: number;
//   insurance: string;
// }
// earnings data types and state removed - not used in current UI

interface metricData {
  date: string;
  diabetes: number;
  blood_pressure: number;
  breast_cancer: number;
  colo_cancer: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Use React Query to fetch and cache all dashboard data
  const { data: gapsChartData = [], isLoading: gapsLoading } = useQuery({
    queryKey: ['chart-data', 'gaps'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: riskChartData = [], isLoading: riskLoading } = useQuery({
    queryKey: ['chart-data', 'risk-score'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data/risk-score', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: outreachChartData = [], isLoading: outreachLoading } = useQuery({
    queryKey: ['chart-data', 'outreach'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data/outreach', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: metricGapsData = [], isLoading: metricGapsLoading } = useQuery({
    queryKey: ['chart-data', 'priority-gaps'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data/priority-gaps', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

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

  const memoMetricGapsLong = useMemo(() => toLongFormat(metricGapsData), [metricGapsData]);

  // Show loading state while any query is loading
  if (gapsLoading || riskLoading || outreachLoading || metricGapsLoading) {
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

  return (
    <Layout showHeader={true}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
        <Grid>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', flexShrink: 0 }}>Insurance Care Gap Closure Over Time</h4>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Chart id="careGapChart" data={gapsChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line' />
              </div>
            </div>
          </div>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', flexShrink: 0 }}>Patient Outreach Over Time</h4>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Chart id="outreachChart" data={outreachChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line' />
              </div>
            </div>
          </div>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', flexShrink: 0 }}>Risk Score Over Time</h4>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Chart id="riskScoreChart" data={riskChartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={70} graphType='line' />
              </div>
            </div>
          </div>
          <div className="card-white">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', flexShrink: 0 }}>Priority Metric Closures Over Time</h4>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Chart id="metricGapsChart" data={memoMetricGapsLong} xColumn="date" yColumn="value" groupColumn="metric" graphType='line'/>
              </div>
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