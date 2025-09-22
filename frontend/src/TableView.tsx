import React from 'react';

interface TableViewProps {
  data: any[];
  onDelete: (id: number) => void;
  headers: string[];
}

const TableView: React.FC<TableViewProps> = ({ data, onDelete, headers }) => {
  if (!data || data.length === 0) {
    return <p>No data to display.</p>;
  }
  
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map(header => (
                <td key={header}>{row[header.toLowerCase()]}</td>
              ))}
              <td>
                <button 
                  onClick={() => onDelete(row.id)} 
                  className="delete-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;