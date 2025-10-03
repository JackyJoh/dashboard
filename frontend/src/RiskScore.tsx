import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DataEntryForm from './DataEntryForm';
import type { FormField } from './DataEntryForm';
import Chart from './Chart';
import { fetchWithAuth } from './api'; // Import the new utility
import { useNavigate } from 'react-router-dom';

interface ChartDataRecord {
  date: string;
  percentage: number;
  insurance: string;
}

const gapsFormFields: FormField[] = [
  { label: 'Risk Closure Rate', name: 'percentage', type: 'text', placeholder: 'Enter the percentage' },
  { label: 'Date', name: 'date', type: 'date' },
  { label: 'Insurance', name: 'insurance', type: 'select', options: ['MyBlue', 'BCBS APO', 'Optum', 'WellMed'] },
];
const RiskScore: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataRecord[]>([]);
  const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // New state to control the form reset
  const navigate = useNavigate();


  //get risk score data
  const fetchChartData = async () => {
    try {
      const response = await fetchWithAuth('/api/chart-data/risk-score', {}, navigate);
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      setError('Failed to load chart data.');
    }
    try {
      const response = await fetchWithAuth('/api/chart-data/risk-score/recent-data', {}, navigate);
      const data = await response.json();
      setRecentData(data);
    } catch (error) {
      console.error('Failed to fetch recent data:', error);
      setError('Failed to load recent data.');
    } finally {
      setLoading(false);
  };
  };

  const handleFormSubmit = async (formData: Record<string, string>) => {
    const percentage = Number.parseFloat(formData.percentage);
    const { date, insurance } = formData;

    if (!date) {
      alert('Please enter a valid date.');
      return;
    }
    if (!insurance) {
      alert('Please select an insurance company.');
      return;
    }

    try {
      const response = await fetch('/api/risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentage, date, insurance }),
      });

      if (!response.ok) {
        throw new Error('Failed to add new data entry.');
      }
      
      const newEntry = await response.json();
      console.log('New entry added successfully:', newEntry);

      // Reset the form by updating the resetKey
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
              title="Add New Risk Closure Data Point"
              fields={gapsFormFields}
              onSubmit={handleFormSubmit}
              resetKey={resetKey} // Pass the reset key to the child component
            />
          </div>
          <div className="gaps-top-row-item">
            <div className="gaps-stats-container">
              {/* <p className="gaps-stats-text">Other Statistics</p> */}
              <Chart data={recentData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='bar'/>
            </div>
          </div>
        </div>
        <div className="gaps-chart-full-width-container">
          <Chart data={chartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={70} graphType='line'/>
        </div>
      </div>
    </Layout>
  );
};

export default RiskScore;