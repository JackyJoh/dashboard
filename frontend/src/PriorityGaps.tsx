import React, { useState } from 'react';
import Layout from './Layout';

const PriorityGaps: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
    console.log('Submitting local file:', selectedFile.name, 'with date:', selectedDate);
    alert(`File "${selectedFile.name}" and date "${selectedDate}" are ready for submission.`);
  };

  return (
    <Layout showHeader={false}>
      <div className="gaps-page-container">
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
              <div style={{ width: '100%', maxWidth: 600, height: 300, minHeight: 200, backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                {/* Chart will go here */}
              </div>
            </div>
          </div>
        </div>
        <div className="gaps-chart-full-width-container">
          <div style={{ width: '100%', height: 400, backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Chart will go here
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PriorityGaps;