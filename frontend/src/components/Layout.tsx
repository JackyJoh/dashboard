// src/Layout.tsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../styles.css';
import { useBodyClass } from '../useBodyClass';
import { jsPDF } from 'jspdf';

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

  const generatePDF = () => {
    // 1. Define all the chart IDs and titles you want in the report
    const reportItems = [
        { id: 'careGapChart', title: '1. Care Gap Closure Over Time' },
        { id: 'riskScoreChart', title: '2. Risk Score Over Time' },
        { id: 'metricGapsChart', title: '3. Priority Metric Closures Over Time' },
        { id: 'outreachChart', title: '4. Patient Outreach Over Time' }
        // Add all chart IDs here
    ];

    // 2. Initialize PDF and tracking variables
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    let y_position = 20; // Starting Y position for the first element
    const margin = 10;
    const maxContentWidth = pdfWidth - 2 * margin;

    // 3. Loop through all defined charts
  reportItems.forEach((item) => {
    const canvasEl = document.getElementById(item.id) as HTMLCanvasElement | null;
    if (!canvasEl) return; // Skip if chart isn't found

    // Try to compute natural width/height; fallback to bounding rect if 0
    const naturalWidth = canvasEl.width || 0;
    const naturalHeight = canvasEl.height || 0;
    const rect = canvasEl.getBoundingClientRect();
    const displayWidth = rect.width || naturalWidth;
    const displayHeight = rect.height || naturalHeight;

    // If we still don't have dimensions, skip this chart to avoid invalid images
    if (!displayWidth || !displayHeight) return;

    const imgData = canvasEl.toDataURL('image/png', 1.0);
    const imgHeight = maxContentWidth * (displayHeight / displayWidth);

        // Add a page break if the current image won't fit on the rest of the page
        if (y_position + imgHeight + 30 > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            y_position = 20; // Reset Y position on new page
        }

        // Add Custom Header Text for the Current Chart
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text(item.title, margin, y_position);
        y_position += 8; // Move down for the image

        // Add the Chart Image
        pdf.addImage(imgData, 'PNG', margin, y_position, maxContentWidth, imgHeight);

        y_position += imgHeight + 15; // Move Y position down for the next chart (with a gap)
    });

    // 4. Save the Final PDF
    pdf.save(`NCH_Full_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
          <div>
            <button id="export-button" className="header-button" onClick={generatePDF} aria-label="Export PDF">
              Export to PDF
            </button>
          </div>
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
      <div className="dashboard-copyright">
        © {new Date().getFullYear()} Naples Comprehensive Health. All rights reserved.
      </div>
    </div>
  );
};

export default Layout;