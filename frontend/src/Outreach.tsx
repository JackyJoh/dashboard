import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DataEntryForm from './DataEntryForm';
import type { FormField } from './DataEntryForm';
import Chart from './Chart';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';
import { CSVLink } from 'react-csv';

interface ChartDataRecord {
  date: string;
  percentage: number;
  insurance: string;
}

const outreachFormFields: FormField[] = [
  { label: 'Outreach Rate', name: 'percentage', type: 'text', placeholder: 'Patients Outreached / Total (eg. 85/120)' },
  { label: 'Date', name: 'date', type: 'date' },
  { label: 'Insurance', name: 'insurance', type: 'select', options: ['MyBlue', 'BCBS APO', 'Optum', 'WellMed'] },
];

const graphsTypeOptions = ['line', 'bar', 'pie'] as const;

const Outreach: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataRecord[]>([]);
//   const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [graphType, setGraphType] = useState<typeof graphsTypeOptions[number]>('line');
  const navigate = useNavigate();

  const fetchChartData = async () => {
    try {
      // Fetch both datasets in parallel
      const [allDataResponse, recentDataResponse] = await Promise.all([
        fetchWithAuth('/api/chart-data/outreach', {}, navigate),
        fetchWithAuth('/api/chart-data/outreach/recent-data', {}, navigate)
      ]);
      
      const allData = await allDataResponse.json();
      const recentData = await recentDataResponse.json();
      
      // Set both states together
      setChartData(allData);
      setRecentData(recentData);
    } catch (error) {
      console.error('Failed to fetch outreach chart data:', error);
      setError('Failed to load outreach chart data.');
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
      const response = await fetchWithAuth('/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentage, date, insurance }),
      }, navigate);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Error: ${errorData.error || 'Failed to submit data'}`);
        return;
      }
      
      const newEntry = await response.json();
      console.log('New outreach entry added successfully:', newEntry);

      setResetKey(prevKey => prevKey + 1);
      await fetchChartData();
      
    } catch (error) {
      console.error('Outreach submission error:', error);
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
              title="Add New Outreach Data Point"
              fields={outreachFormFields}
              onSubmit={handleFormSubmit}
              resetKey={resetKey}
            />
          </div>
          <div className="gaps-top-row-item">
            <div className="gaps-stats-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
              <p className="gaps-stats-text" style={{ margin: '0.25rem' }}>Most Recent Outreach Data</p>
              <div style={{ width: '100%', maxWidth: 600, height: 300, minHeight: 200 }}>
                {<Chart data={recentData} xColumn="date" yColumn="percentage" groupColumn="insurance" maxY={100} graphType='bar'/> }
              </div>
            </div>
          </div>
        </div>
        <div className="gaps-chart-full-width-container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
            <button 
              className="small-btn"
              aria-label="Fullscreen"
              onClick={() => setIsFullscreen(true)}
            >
              <img src="/fullscreen.png" alt="Fullscreen" style={{ transform: 'scale(1.7)' }} />
            </button>
            <CSVLink 
              data={chartData}
              filename={"patient_outreach_data.csv"}
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
          <div style={{ width: '100%', height: 400, minHeight: 300 }}>
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
            padding: '2rem',
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            style={{
              width: '95%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.75rem', color: '#333' }}>
              Patient Outreach over Time
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

export default Outreach;
