import React, { useMemo } from 'react';

const formatLastUpdated = (d: Date) =>
  d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
import Chart from './Chart';
import Layout from './components/Layout';
import Grid from './components/Grid';
import { fetchWithAuth } from './api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

function getMonthAvg(
  data: any[],
  getValue: (row: any) => number
): { current: number | null; prev: number | null } {
  if (!data.length) return { current: null, prev: null };
  const maxTime = Math.max(...data.map(d => new Date(d.date).getTime()));
  const maxDate = new Date(maxTime);
  const curMonth = maxDate.getMonth();
  const curYear = maxDate.getFullYear();
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;
  const curEntries = data.filter(d => {
    const dt = new Date(d.date);
    return dt.getMonth() === curMonth && dt.getFullYear() === curYear;
  });
  const prevEntries = data.filter(d => {
    const dt = new Date(d.date);
    return dt.getMonth() === prevMonth && dt.getFullYear() === prevYear;
  });
  const avg = (arr: any[]) =>
    arr.length ? arr.reduce((s, d) => s + getValue(d), 0) / arr.length : null;
  return { current: avg(curEntries), prev: avg(prevEntries) };
}

function StatDelta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current === null) return <span className="stat-card-delta neutral">No data</span>;
  if (prev === null) return <span className="stat-card-delta neutral">No prior data</span>;
  const delta = current - prev;
  if (Math.abs(delta) < 0.05) return <span className="stat-card-delta neutral">No change</span>;
  const dir = delta > 0 ? 'up' : 'down';
  const arrow = delta > 0 ? '↑' : '↓';
  return (
    <span className={`stat-card-delta ${dir}`}>
      {arrow} {Math.abs(delta).toFixed(1)} from last month
    </span>
  );
}

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
  const { data: gapsChartData = [], isLoading: gapsLoading, dataUpdatedAt: gapsUpdatedAt } = useQuery({
    queryKey: ['chart-data', 'gaps'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: riskChartData = [], isLoading: riskLoading, dataUpdatedAt: riskUpdatedAt } = useQuery({
    queryKey: ['chart-data', 'risk-score'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data/risk-score', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: outreachChartData = [], isLoading: outreachLoading, dataUpdatedAt: outreachUpdatedAt } = useQuery({
    queryKey: ['chart-data', 'outreach'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/chart-data/outreach', {}, navigate);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: metricGapsData = [], isLoading: metricGapsLoading, dataUpdatedAt: metricGapsUpdatedAt } = useQuery({
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

  const gapStats = useMemo(() => getMonthAvg(gapsChartData, d => Number(d.percentage)), [gapsChartData]);
  const outreachStats = useMemo(() => getMonthAvg(outreachChartData, d => Number(d.percentage)), [outreachChartData]);
  const riskStats = useMemo(() => getMonthAvg(riskChartData, d => Number(d.percentage)), [riskChartData]);
  const priorityMetrics = useMemo(() => [
    { label: 'Diabetes', ...getMonthAvg(metricGapsData, d => Number(d.diabetes)) },
    { label: 'Blood Pressure', ...getMonthAvg(metricGapsData, d => Number(d.blood_pressure)) },
    { label: 'Breast Cancer', ...getMonthAvg(metricGapsData, d => Number(d.breast_cancer)) },
    { label: 'Colorectal', ...getMonthAvg(metricGapsData, d => Number(d.colo_cancer)) },
  ], [metricGapsData]);

  const lastUpdatedMs = Math.max(gapsUpdatedAt, riskUpdatedAt, outreachUpdatedAt, metricGapsUpdatedAt);
  const lastUpdated = lastUpdatedMs > 0 ? new Date(lastUpdatedMs) : null;

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

  const pctStats = [
    { label: 'Care Gap Closure', ...gapStats },
    { label: 'Patient Outreach', ...outreachStats },
    { label: 'Risk Score', ...riskStats },
  ];

  return (
    <Layout showHeader={true}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
        <div className="stats-row">
          <span className="stats-row-header">Current month averages</span>
          {pctStats.map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-card-label">{s.label}</span>
              <span className="stat-card-value">
                {s.current !== null ? `${s.current.toFixed(1)}%` : '--'}
              </span>
              <StatDelta current={s.current} prev={s.prev} />
            </div>
          ))}
          <div className="stat-card">
            <span className="stat-card-label">Priority Metrics</span>
            <div className="priority-metric-rows">
              {priorityMetrics.map(m => {
                const delta = m.current !== null && m.prev !== null ? Math.round(m.current - m.prev) : null;
                return (
                  <div key={m.label} className="priority-metric-row">
                    <span className="priority-metric-name">{m.label}</span>
                    <span className="priority-metric-value">{m.current !== null ? Math.round(m.current) : '--'}</span>
                    <span className={`priority-metric-delta ${!delta ? 'neutral' : delta > 0 ? 'up' : 'down'}`}>
                      {!delta ? '0' : `${delta > 0 ? '↑' : '↓'}${Math.abs(delta)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
        <div className="dashboard-footer">
          {lastUpdated && (
            <span className="chart-last-updated" style={{ marginRight: '1.5rem' }}>
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <span className="dashboard-copyright-text">© {new Date().getFullYear()} Naples Comprehensive Health. All rights reserved.</span>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;