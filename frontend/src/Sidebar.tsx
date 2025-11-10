import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './styles.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname || '/';

  const makeLink = (to: string, label: string) => {
    const isActive = pathname === to;
    return (
      <li>
        <Link to={to} className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>{label}</Link>
      </li>
    );
  };

  return (
    <div id="sidebar" className="sidebar">
      <ul>
        {makeLink('/', 'Dashboard')}
        {makeLink('/gaps', 'Insurance Closures')}
        {makeLink('/priority', 'Metric Closures')}
        {makeLink('/outreach', 'Patient Outreach')}
        {makeLink('/risk', 'Risk Score')}
        {/* {makeLink('/other', 'Other')} */}
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