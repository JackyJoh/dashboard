import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DataEntryForm from './DataEntryForm';
import type { FormField } from './DataEntryForm';
import Chart from './Chart';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';
import { CSVLink } from "react-csv";


interface ChartDataRecord {
  date: string;
  percentage: number;
  insurance: string;
}

const gapsFormFields: FormField[] = [
  { label: 'Ratio of Closure Amount', name: 'percentage', type: 'text', placeholder: 'Closed / Total (eg. 100/150)' },
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
    const { percentage, date, insurance } = formData;

     if (!percentage) {
      alert('Please enter a valid percentage.');
      return;
    }

    // Validate percentage format (numerator/denominator)
    const parts = percentage.split('/');
    if (parts.length !== 2) {
      alert('Percentage must be in format "numerator/denominator" (e.g., 85/120)');
      return;
    }
    
    const numerator = parseInt(parts[0].trim(), 10);
    const denominator = parseInt(parts[1].trim(), 10);
    
    if (isNaN(numerator) || isNaN(denominator) || numerator < 0 || denominator <= 0) {
      alert('Please enter valid numbers for numerator and denominator (denominator must be greater than 0)');
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
      <Layout showHeader={false}>
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
              title="Add Insurance Gap Closure Data Point"
              fields={gapsFormFields}
              onSubmit={handleFormSubmit}
              resetKey={resetKey}
            />
          </div>
          <div className="gaps-top-row-item">
            <div className="gaps-stats-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
              <p className="gaps-stats-text" style={{ margin: '0.25rem' }}>Most Recent Insurance Closure Data</p>
              <div style={{ width: '100%', maxWidth: 600, height: 300, minHeight: 200 }}>
                <Chart data={recentData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='bar'/>
              </div>
            </div>
          </div>
        </div>
        <div className="gaps-chart-full-width-container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <CSVLink 
              data={chartData}
              filename={"care_gap_closure_data.csv"}
              className="small-btn"
              aria-label="Download CSV"
            >
              <img src="/export.png" alt="Export" />
            </CSVLink>
          </div>
          <div style={{ width: '100%', height: 400, minHeight: 300 }}>
            <Chart data={chartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='line'/>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Gaps;