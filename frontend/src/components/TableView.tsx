import React, { useState } from 'react';

import '../styles.css';


interface TableViewProps {
  data: any[];
  onDelete: (id: number) => void;
  onEdit: (id: number, updatedRow: Record<string, any>) => Promise<void>;
  headers?: string[]; // optional — derive from data when not provided
  // Columns that cannot be edited (always includes id, created_at)
  nonEditableColumns?: string[];
}

const ALWAYS_NON_EDITABLE = ['id', 'created_at', 'percentage'];

const TableView: React.FC<TableViewProps> = ({ data, onDelete, onEdit, headers, nonEditableColumns = [] }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const effectiveHeaders: string[] = React.useMemo(() => {
    if (headers && headers.length > 0) return headers;
    if (data && data.length > 0) return Object.keys(data[0]);
    return [];
  }, [headers, data]);

  const isNonEditable = (header: string) =>
    ALWAYS_NON_EDITABLE.includes(header) || nonEditableColumns.includes(header);

  const handleEditClick = (row: any) => {
    setEditingId(row.id);
    setEditValues({ ...row });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      await onEdit(id, editValues);
      setEditingId(null);
      setEditValues({});
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (header: string, value: string) => {
    setEditValues(prev => ({ ...prev, [header]: value }));
  };

  // Helper function to format cell values for display
  const formatCellValue = (value: any, header: string): string => {
    if (value === null || value === undefined) return '';
    if (header.toLowerCase().includes('date') && typeof value === 'string') {
      if (value.includes('T')) {
        return value.split('T')[0];
      }
    }
    return String(value);
  };

  // Determine input type based on header name
  const getInputType = (header: string): string => {
    if (header.toLowerCase().includes('date')) return 'date';
    if (['numerator', 'denominator', 'percentage', 'diabetes', 'blood_pressure', 'breast_cancer', 'colo_cancer'].includes(header)) return 'number';
    return 'text';
  };

  // Format value for use in an input field
  const getInputValue = (header: string, value: any): string => {
    if (value === null || value === undefined) return '';
    if (header.toLowerCase().includes('date') && typeof value === 'string') {
      return value.includes('T') ? value.split('T')[0] : value;
    }
    return String(value);
  };

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
      {data.map((row, rowIndex) => {
        const isEditing = editingId === row.id;
        return (
          <tr key={rowIndex} className={isEditing ? 'editing-row' : ''}>
            {effectiveHeaders.map(header => (
              <td key={header}>
                {isEditing && !isNonEditable(header) ? (
                  <input
                    className="edit-input"
                    type={getInputType(header)}
                    value={getInputValue(header, editValues[header])}
                    onChange={e => handleInputChange(header, e.target.value)}
                    step={getInputType(header) === 'number' ? 'any' : undefined}
                  />
                ) : (
                  formatCellValue(row[header], header)
                )}
              </td>
            ))}
            <td className="action-cell">
              {isEditing ? (
                <div className="action-buttons">
                  <button
                    onClick={() => handleSave(row.id)}
                    className="save-button"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="cancel-button"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="action-buttons">
                  <button
                    onClick={() => handleEditClick(row)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(row.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

export default TableView;
