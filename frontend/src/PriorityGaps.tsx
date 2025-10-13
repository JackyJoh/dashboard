import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import Chart from './Chart';
import { fetchWithAuth } from './api'; // Import the new utility
import { useNavigate } from 'react-router-dom';

interface ChartDataRecord {
  date: string;
  diabetes: number;
  blood_pressure: number;
  breast_cancer: number;
  colo_cancer: number;
}


const PriorityGaps: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataRecord[]>([]);
  const [recentData, setRecentData] = useState<ChartDataRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [excelLoading, setExcelLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const fetchChartData = async () => {
      try {
        const response = await fetchWithAuth('/api/chart-data/priority-gaps', {}, navigate);
        const data = await response.json();
        setExcelLoading(false);
        setChartData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
        setError('Failed to load chart data.');
      }
      try {
        //Replace with recent data endpoint when available
        const response2 = await fetchWithAuth('/api/chart-data/priority-gaps', {}, navigate);
        const data2 = await response2.json();
        // use last 1 entries as recent
        setRecentData(Array.isArray(data2) ? data2.slice(-1) : []);
      } catch (error) {
        console.error('Failed to fetch recent data:', error);
        setError('Failed to load recent data.');
      } finally {
        setLoading(false);
      }
    };

  const handleSubmit = () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!selectedDate) {
      alert('Please select a date.');
      return;
    }
    // Placeholder for future implementation
    const formData = new FormData();
    formData.append('excelFile', selectedFile);
    formData.append('date', selectedDate);

    (async () => {
      try {
        //setLoading(true);
        setExcelLoading(true);
        setError(null);

        // 1) send the file to be processed by Python
        const procResp = await fetchWithAuth('/api/priority-gaps', { method: 'POST', body: formData }, navigate);
        if (!procResp.ok) {
          const err = await procResp.json().catch(() => ({ error: 'Processing failed' }));
          throw new Error(err.error || 'Processing failed');
        }
        const processed = await procResp.json();
        setExcelLoading(false);

        // 2) save processed metrics to DB
        const saveResp = await fetchWithAuth('/api/priority-gaps/processed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: processed.date || selectedDate, metrics: processed }),
        }, navigate);

        if (!saveResp.ok) {
          const err = await saveResp.json().catch(() => ({ error: 'Save failed' }));
          throw new Error(err.error || 'Save failed');
        }

        // 3) refresh charts
        setLoading(true);
        await fetchChartData();

        // reset
        setSelectedFile(null);
        setSelectedDate('');
        // alert('File processed and saved successfully');

      } catch (e: any) {
        console.error('Submit flow failed:', e);
        setError(e.message || 'Submission failed');
      } finally {
        setLoading(false);
      }
    })();
    // console.log('Submitting local file:', selectedFile.name, 'with date:', selectedDate);
    // alert(`File "${selectedFile.name}" and date "${selectedDate}" are ready for submission.`);
  };

  // Convert wide-format rows (date + metric columns) into long format:
  // [{ date, metric: 'diabetes', value: 10 }, ...]
  const toLongFormat = (rows: ChartDataRecord[]) => {
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

  // Memoize long-format conversions so they don't get re-created on every render
  // (typing into other inputs like the date field will cause a render but should
  // not force the charts to rebuild unless the underlying chart data changed).
  const memoChartLong = useMemo(() => toLongFormat(chartData), [chartData]);
  const memoRecentLong = useMemo(() => toLongFormat(recentData), [recentData]);

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

  // We'll show processing placeholders inside the chart containers while excel is processing.

  return (
    <Layout showHeader={false}>
      <div className="gaps-page-container">
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div className="gaps-top-row">
          <div className="gaps-top-row-item">
            <div className="data-entry-form">
              <h4>Upload Care Gap Data</h4>

              {/* --- Option 1: OneDrive (Placeholder) --- */}
              <div style={{ marginBottom: '1rem', paddingBottom: '1.2rem', borderBottom: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>
                  Option 1: Connect to OneDrive
                </label>
                <button className="form-button" disabled>
                  Connect & Browse OneDrive
                </button>
              </div>

              {/* --- Option 2: Local File Upload --- */}
              <div style={{ paddingTop: '0rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>
                  Option 2: Upload from your computer
                </label>
                
                <div style={{ marginBottom: '1rem' }}>

                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="form-input"
                  />
                  {selectedFile && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10b981' }}>
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="date-input" style={{ display: 'block', marginBottom: '0.25rem' }}>
                    Date
                  </label>
                  <input
                    id="date-input"
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <button onClick={handleSubmit} className="form-button">
                  Submit
                </button>
              </div>

            </div>
          </div>
          
          {/* Right Panel: Stats/Metric Display */}
          <div className="gaps-top-row-item">
            <div className="gaps-stats-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
              <p className="gaps-stats-text" style={{ margin: '0.25rem' }}>Most Recent Metric Gap Data</p>
                <div style={{ width: '100%', maxWidth: 600, height: 300, minHeight: 200, borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {excelLoading ? (
                    <div style={{ textAlign: 'center', fontSize: '2rem' }}>Processing Excel file...</div>
                  ) : (
                    <Chart data={memoRecentLong} xColumn="date" yColumn="value" groupColumn="metric" graphType='line' />
                  )}
                </div>
            </div>
          </div>
        </div>
        <div className="gaps-chart-full-width-container">
          <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {excelLoading ? (
              <div style={{ textAlign: 'center', color: '#374151', fontSize: '5rem' }}>Processing Excel file...</div>
            ) : (
              <Chart data={memoChartLong} xColumn="date" yColumn="value" groupColumn="metric" graphType='line'/>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PriorityGaps;