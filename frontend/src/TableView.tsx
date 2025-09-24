import React from 'react';

import './styles.css';


interface TableViewProps {
  data: any[];
  onDelete: (id: number) => void;
  headers?: string[]; // optional — derive from data when not provided
}

// TableView renders only the <tbody>. If headers are not provided the
// component will derive column keys from the first data row.
const TableView: React.FC<TableViewProps> = ({ data, onDelete, headers }) => {
  const effectiveHeaders: string[] = React.useMemo(() => {
    if (headers && headers.length > 0) return headers;
    if (data && data.length > 0) return Object.keys(data[0]);
    return [];
  }, [headers, data]);

  if (!data || data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={effectiveHeaders.length + 1}>No data to display.</td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {data.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {effectiveHeaders.map(header => (
            <td key={header}>{String(row[header] ?? '')}</td>
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
  );
};

export default TableView;