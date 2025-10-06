import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DataEntryForm from './DataEntryForm';
import type { FormField } from './DataEntryForm';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';

const priorityGapsFormFields: FormField[] = [
  { label: 'Date', name: 'date', type: 'date' },
];

const PriorityGaps: React.FC = () => {
  const [resetKey, setResetKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  // Reset file selection when form is reset
  useEffect(() => {
    setSelectedFile(null);
  }, [resetKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleFormSubmit = async (formData: Record<string, string>) => {
    const { date } = formData;

    if (!selectedFile) {
      alert('Please select an Excel file.');
      return;
    }
    
    if (!date) {
      alert('Please enter a valid date.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('excelFile', selectedFile);
      formDataToSend.append('date', date);

      const response = await fetchWithAuth('/api/priority-gaps', {
        method: 'POST',
        body: formDataToSend, // Don't set Content-Type header   for FormData
      }, navigate);
      
      const result = await response.json();
      console.log('Priority gaps file uploaded successfully:', result);
      alert('Excel file uploaded successfully!');

      setResetKey(prevKey => prevKey + 1);
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Priority gaps submission error:', error);
      alert('Failed to upload Excel file. Please try again.');
    }
  };

  return (
    <Layout showHeader={false}>
      <div className="gaps-page-container">
        <div className="gaps-top-row">
          <div className="gaps-top-row-item">
            <div className="data-entry-form">
              <h4>Upload Priority Gap Excel File</h4>
              <div className="data-entry-form-fields">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568' }}>
                    Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="form-input"
                  />
                  {selectedFile && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#10b981' }}>
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <DataEntryForm
                  title=""
                  fields={priorityGapsFormFields}
                  onSubmit={handleFormSubmit}
                  resetKey={resetKey}
                />
              </div>
            </div>
          </div>
          <div className="gaps-top-row-item">
            <div className="gaps-stats-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
              <p className="gaps-stats-text" style={{ margin: '0.25rem' }}>Most Recent Priority Gaps Data</p>
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
