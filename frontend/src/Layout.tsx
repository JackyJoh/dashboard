// src/Layout.tsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './styles.css';
import { useBodyClass } from './useBodyClass';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean; // New prop for showing/hiding the header
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useBodyClass('sidebar-open', isSidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="main-container">
      {showHeader && ( // This is the conditional rendering
        <header className="app-header">
          <button id="menu-button" className="header-button" onClick={toggleSidebar}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <p className="header-title">NCH Dashboard</p>
          <div></div>
        </header>
      )}

      <div 
        id="overlay" 
        className={`hidden fixed inset-0 bg-black opacity-50 z-40 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={closeSidebar}
      ></div>

      <div className="content-layout">
        <Sidebar />
        <div id="main-content-area" className="main-content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;