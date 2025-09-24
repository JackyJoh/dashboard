import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DataEntryForm from './DataEntryForm';
import type { FormField } from './DataEntryForm';
import Chart from './Chart';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';

interface ChartDataRecord {
  date: string;
  percentage: number;
  insurance: string;
}

const gapsFormFields: FormField[] = [
  { label: 'Percent Closure Amount', name: 'percentage', type: 'text', placeholder: 'Enter the percentage' },
  { label: 'Date', name: 'date', type: 'date' },
  { label: 'Insurance', name: 'insurance', type: 'select', options: ['MyBlue', 'BCBS APO', 'Optum', 'WellMed'] },
];

const Gaps: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataRecord[]>([]);
  const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const navigate = useNavigate();

  const fetchChartData = async () => {
    try {
      const response = await fetchWithAuth('/api/chart-data', {}, navigate);
      const data = await response.json();
      setChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      setError('Failed to load chart data.');
    }
    try {
      const response = await fetchWithAuth('/api/gaps/recent-data', {}, navigate);
      const data = await response.json();
      setRecentData(data);
    } catch (error) {
      console.error('Failed to fetch recent data:', error);
      setError('Failed to load recent data.');
    }
    setLoading(false);

  };

  const handleFormSubmit = async (formData: Record<string, string>) => {
    const percentage = Number.parseFloat(formData.percentage);
    const { date, insurance } = formData;

    if (!percentage || isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    if (!date) {
      alert('Please enter a valid date.');
      return;
    }
    if (!insurance) {
      alert('Please select an insurance company.');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/gaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentage, date, insurance }),
      }, navigate);
      
      const newEntry = await response.json();
      console.log('New entry added successfully:', newEntry);

      setResetKey(prevKey => prevKey + 1);
      await fetchChartData();
      
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <Layout showHeader={true}>
        <div className="loading-box">
          <p className="loading-text">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return <Layout showHeader={false}><div>Error: {error}</div></Layout>;
  }

  return (
    <Layout showHeader={false}>
      <div className="gaps-page-container">
        <div className="gaps-top-row">
          <div className="gaps-top-row-item">
            <DataEntryForm
              title="Add New Care Gap Data Point"
              fields={gapsFormFields}
              onSubmit={handleFormSubmit}
              resetKey={resetKey}
            />
          </div>
          <div className="gaps-top-row-item">
            <div className="gaps-stats-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
              <p className="gaps-stats-text" style={{ margin: '0.25rem' }}>Most Recent Data</p>
              <div style={{ width: '100%', maxWidth: 600, height: 300, minHeight: 200 }}>
                <Chart data={recentData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='bar'/>
              </div>
            </div>
          </div>
        </div>
        <div className="gaps-chart-full-width-container">
          <Chart data={chartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line'/>
        </div>
      </div>
    </Layout>
  );
};

export default Gaps;