import React from 'react';
import type { DateRange } from '../useDateFilter';

const OPTIONS: DateRange[] = ['3M', '6M', '1Y', 'All'];

const DateRangeToggle: React.FC<{ range: DateRange; onChange: (r: DateRange) => void }> = ({ range, onChange }) => (
  <div className="date-range-toggle">
    {OPTIONS.map(o => (
      <button
        key={o}
        className={`date-range-btn${range === o ? ' active' : ''}`}
        onClick={() => onChange(o)}
      >
        {o}
      </button>
    ))}
  </div>
);

export default DateRangeToggle;
