import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataEntryForm from '../components/DataEntryForm';
import type { FormField } from '../components/DataEntryForm';
import Chart from '../Chart';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../api';
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

const graphsTypeOptions = ['line', 'bar', 'pie'] as const;

const Gaps: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataRecord[]>([]);
  const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [graphType, setGraphType] = useState<typeof graphsTypeOptions[number]>('line');
  const navigate = useNavigate();

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/chart-data', {}, navigate);
      const data = await response.json();
      setChartData(data);
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
    } finally {
      setLoading(false);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <p className="gaps-stats-text" style={{ margin: '0.25rem', fontSize: 'clamp(0.9rem, 2.5vw, 1.125rem)' }}>Most Recent Insurance Closure Data</p>
              <div style={{ width: '100%', maxWidth: 600, height: '100%', minHeight: 200, flex: 1 }}>
                <Chart data={recentData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='bar'/>
              </div>
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
              data={chartData}
              filename={"care_gap_closure_data.csv"}
              className="small-btn"
              aria-label="Download CSV"
            >
              <img src="/export.png" alt="Export" />
            </CSVLink>
            <button 
              className="small-btn"
              aria-label="Change graph type"
              onClick={rotateGraphType}
            >
              <img src="/73450.png" alt="Change graph type" />
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
              Insurance Gap Closures over Time
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

export default Gaps;