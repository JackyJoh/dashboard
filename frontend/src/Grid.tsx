// src/Grid.tsx
import React from 'react';

const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="main-grid">
      {children}
    </div>
  );
};

export default Grid;