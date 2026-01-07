import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchWithAuth } from '../api';
import { useNavigate } from 'react-router-dom';
import TableView from '../components/TableView';
import '../styles.css';


const Settings: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]); // Using 'any[]' for flexibility
  const [headers, setHeaders] = useState<string[]>([]); // Dynamic headers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState('closure_percentage'); // New state for the dropdown
  const navigate = useNavigate();

  const fetchTableData = async () => {
    try {
      const response = await fetchWithAuth(`/api/table-data/${selectedTable}`, {}, navigate);
      const data = await response.json();
      setTableData(data);
      //Set headers dynamically from first row, if available
      if (Array.isArray(data) && data.length > 0) {
        setHeaders(Object.keys(data[0]));
      } else {
        setHeaders([]);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this record? This action cannot be undone.');
    
    if (!confirmed) {
      return; // User cancelled, don't delete
    }

    try {
      await fetchWithAuth(`/api/table-data/${selectedTable}/${id}`, { method: 'DELETE' }, navigate);
      await fetchTableData();
    } catch (e) {
      console.error(e);
      setError('Failed to delete record.');
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [selectedTable]);

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
    return <Layout showHeader={true}><div>Error: {error}</div></Layout>;
  }
  


  return (
  <Layout showHeader={true}>
    <div className="settings-page-container">
      <div className="settings-card">
        <h3 className="settings-subtitle">Manage data tables and configurations</h3>
        <div className="table-selector-container">
          <label htmlFor="table-selector" className="table-selector-label">
            Choose a table to view and edit:
          </label>
          <select 
            id="table-selector" 
            className="table-select-styled"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="closure_percentage">Insurance Closure Data</option>
            <option value="risk_closure">Risk Closure Data</option>
            <option value="pt_outreach">Patient Outreach Data</option>
            <option value="priority_gaps">Metrics Closure Data</option>
            {/* <option value="closure_earnings">Closure Earnings Data</option> */}
          </select>
        </div>
      </div>
    
      

      <div className="settings-card table-data-card">
        <h2 className="settings-card-title">
          Table Data: {selectedTable.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </h2>
        <p className="settings-card-description">
          Below is the data for the selected table. You can remove individual rows using the delete button.
        </p>

        {/* Visual spacer outside the scrollable area so the header can stick at top:0 */}
        <div className="table-spacer" aria-hidden="true" />
        {/* Combined Table (thead + scrollable tbody) */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <TableView data={tableData} onDelete={handleDelete} headers={headers} />
          </table>
        </div>
      </div>
    </div>
  </Layout>
);
};

export default Settings;