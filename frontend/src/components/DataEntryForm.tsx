import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import '../styles.css';

// This is the structure for our new fields prop
export interface FormField { 
    label: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    placeholder?: string;
    options?: string[];
}

interface DataEntryFormProps {
  title: string;
  fields: FormField[];
  onSubmit: (formData: Record<string, string>) => void;
  resetKey: number; // New prop for resetting the form
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ title, fields, onSubmit, resetKey }) => {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );

  // This useEffect hook watches the resetKey prop
  useEffect(() => {
    // When the key changes, reset the form data
    setFormData(fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}));
  }, [resetKey, fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
  <div className="data-entry-form">
    <h4 className="">{title}</h4>
    <form onSubmit={handleSubmit} className="data-entry-form-fields">
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name} className="">
            <strong>{field.label}</strong>
          </label>
          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className="form-input"
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        className="form-button"
      >
        Add Entry
      </button>
    </form>
  </div>
);
};

export default DataEntryForm;