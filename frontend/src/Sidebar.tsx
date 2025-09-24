import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

const Sidebar: React.FC = () => {
  return (
    <div id="sidebar" className="sidebar">
      <ul>
        <li><Link to="/" className="sidebar-link">Dashboard</Link></li>
        <li><Link to="/gaps" className="sidebar-link">Care Gap Closure</Link></li>
        <li><Link to="/entry" className="sidebar-link">Patient Access Goals</Link></li>
        <li><Link to="/risk" className="sidebar-link">Risk Score</Link></li>
        <li><Link to="/other" className="sidebar-link">Other</Link></li>
      </ul>
      <div className="sidebar-footer">
        <div className="sidebar-footer-links">
          <Link to="/settings" className="sidebar-settings-link">
            <img src="/settings.png" alt="Settings" className="sidebar-settings-icon" />
          </Link>
          <img src="logo.png" alt="Logo" className="sidebar-logo" />
        </div>
        <p>Naples Comprehensive Health</p>
      </div>
    </div>
  );
};

export default Sidebar;