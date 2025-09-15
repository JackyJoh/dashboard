import React from 'react';
import './styles.css';

const Sidebar: React.FC = () => {
  return (
    <div id="sidebar" className="sidebar">
      <ul>
        <li><a href="/">Dashboard</a></li>
        <li><a href="/gaps">Care Gap Closure</a></li>
        <li><a href="/entry">Patient Access Goals</a></li>
        <li><a href="/risk">Risk Score</a></li>
        <li><a href="/other">Other</a></li>
      </ul>
    </div>
  );
};

export default Sidebar;