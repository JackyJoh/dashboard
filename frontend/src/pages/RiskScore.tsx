import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataEntryForm from '../components/DataEntryForm';
import type { FormField } from '../components/DataEntryForm';
import Chart from '../Chart';
import { fetchWithAuth } from '../api'; // Import the new utility
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';

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

const graphsTypeOptions = ['line', 'bar', 'pie'] as const;

const RiskScore: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataRecord[]>([]);
  const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // New state to control the form reset
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const navigate = useNavigate();
  const [graphType, setGraphType] = useState<typeof graphsTypeOptions[number]>('line');


  //get risk score data
  const fetchChartData = async () => {
    try {
      const response = await fetchWithAuth('/api/chart-data/risk-score', {}, navigate);
      const data = await response.json();
      setChartData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      setChartData([]);
      setError('Failed to load chart data.');
    }
    try {
      const response = await fetchWithAuth('/api/chart-data/risk-score/recent-data', {}, navigate);
      const data = await response.json();
      setRecentData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch recent data:', error);
      setRecentData([]);
      setError('Failed to load recent data.');
    } finally {
      setLoading(false);
  };
  };

  //rotate graph type
  const rotateGraphType = () => {
    setGraphType((prevType) => {
      const currentIndex = graphsTypeOptions.indexOf(prevType);
      const nextIndex = (currentIndex + 1) % graphsTypeOptions.length;
      return graphsTypeOptions[nextIndex];
    });
  }

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="small-btn"
              aria-label="Fullscreen"
              onClick={() => setIsFullscreen(true)}
            >
              <img src="/fullscreen.png" alt="Fullscreen" style={{ transform: 'scale(1.7)' }} />
            </button>
            <CSVLink 
              data={Array.isArray(chartData) && chartData.length > 0 ? chartData : []}
              filename={"risk_score_data.csv"}
              className="small-btn"
              aria-label="Download CSV"
            >
              <img src="/export.png" alt="Export" />
            </CSVLink>
            <button 
              className="small-btn"
              aria-label="Third button"
              onClick={rotateGraphType}
            >
              <img src="/73450.png" alt="Third button" />
            </button>
          </div>
          <div style={{ width: '100%', height: 'clamp(300px, 50vh, 500px)', minHeight: 250 }}>
            <Chart data={chartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType={graphType}/>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(0.5rem, 3vw, 2rem)',
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            style={{
              width: '95%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: 'clamp(1rem, 3vw, 2rem)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: 'clamp(0.5rem, 2vw, 1rem)',
                right: 'clamp(0.5rem, 2vw, 1rem)',
                background: 'transparent',
                border: 'none',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', color: '#333' }}>
              Risk Score Closures over Time
            </h2>
            <div style={{ width: '100%', height: 'calc(100% - 4rem)' }}>
              <Chart data={chartData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType={graphType}/>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RiskScore;