import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchWithAuth } from '../api';
import { useNavigate } from 'react-router-dom';
import TableView from '../components/TableView';
import '../styles.css';


const Settings: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState('closure_percentage');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return tableData;
    return [...tableData].sort((a, b) => {
      const av = a[sortColumn], bv = b[sortColumn];
      const an = Number(av), bn = Number(bv);
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [tableData, sortColumn, sortDir]);

  const filteredData = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedData;
    return sortedData.filter(row =>
      Object.values(row).some(val => String(val ?? '').toLowerCase().includes(q))
    );
  }, [sortedData, searchQuery]);

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

  const handleEdit = async (id: number, updatedRow: Record<string, any>) => {
    try {
      const response = await fetchWithAuth(`/api/table-data/${selectedTable}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow),
      }, navigate);

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Failed to update record.');
        return;
      }

      await fetchTableData();
    } catch (e) {
      console.error(e);
      setError('Failed to update record.');
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [selectedTable]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  if (loading) {
    return (
      <Layout showHeader={true}>
        <div className="loading-box">
          <p className="loading-text">Loading...</p>
        </div>
      </Layout>
    );
  }
  


  return (
  <Layout showHeader={true}>
    <div className="settings-page-container">
      {error && (
        <div className="settings-error-banner">
          {error}
          <button className="settings-error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}
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
            onChange={(e) => { setSelectedTable(e.target.value); setError(null); setSortColumn(null); setSearchQuery(''); }}
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
          Below is the data for the selected table. Use the Edit button to modify a row inline, or Delete to remove it.
        </p>

        <input
          type="text"
          className="table-search-input"
          placeholder="Search all columns..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {/* Visual spacer outside the scrollable area so the header can stick at top:0 */}
        <div className="table-spacer" aria-hidden="true" />
        {/* Combined Table (thead + scrollable tbody) */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header} className="sortable-th" onClick={() => handleSort(header)}>
                    {header}
                    <span className="sort-indicator">
                      {sortColumn === header ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                    </span>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <TableView data={filteredData} onDelete={handleDelete} onEdit={handleEdit} headers={headers} />
          </table>
        </div>
      </div>
    </div>
  </Layout>
);
};

export default Settings;