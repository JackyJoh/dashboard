import React, { useState, useEffect } from 'react';
import './styles.css';
import { fetchWithAuth } from './api';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import TableView from './TableView';

interface TableDataRecord {
  id: number;
  insurance: string;
  date: string;
  percentage: number;
}

const Settings: React.FC = () => {
  const [tableData, setTableData] = useState<TableDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTableData = async () => {
    try {
      const response = await fetchWithAuth('/api/table-data', {}, navigate);
      const data = await response.json();
      setTableData(data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetchWithAuth(`/api/table-data/${id}`, { method: 'DELETE' }, navigate);
      await fetchTableData(); // Refresh the table
    } catch (e) {
      console.error(e);
      setError('Failed to delete record.');
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  if (loading) {
    return <Layout showHeader={true}><div>Loading...</div></Layout>;
  }
  if (error) {
    return <Layout showHeader={true}><div>Error: {error}</div></Layout>;
  }
  
  const headers = ['id', 'date', 'percentage', 'insurance'];


 return (
    <Layout showHeader={true}>
      <div className="p-4">        
        {/* New Dropdown Selector */}
        <div className="table-selector-container">
          <label htmlFor="table-selector">Select a Table:</label>
          <select id="table-selector" className="table-select">
            <option value="closure_percentage">Care Gap Closure</option>
            <option value="risk_closure">Risk Closure</option>
          </select>
        </div>

        <h4 style={{ margin: '0 0 7px 0' }}>Table view option to delete rows</h4>
        <div className="table-wrapper">
          <TableView data={tableData} onDelete={handleDelete} headers={headers} />
        </div>
      </div>
    </Layout>
  );
};

export default Settings;