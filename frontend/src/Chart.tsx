import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';

ChartJS.register(...registerables);

interface ChartProps {
  data: any[];
  graphType: 'line' | 'bar' | 'donut' | 'pie';
  xColumn?: string;
  yColumn?: string;
  groupColumn?: string;
  maxY?: number;
  id?: string;
}

// Define a set of up to 6 distinct colors
const COLORS = [
  'rgba(255, 99, 132, 1)', // Red
  'rgba(54, 162, 235, 1)', // Blue
  'rgba(255, 206, 86, 1)', // Yellow
  'rgba(75, 192, 192, 1)', // Teal
  'rgba(153, 102, 255, 1)', // Purple
  'rgba(255, 159, 64, 1)'  // Orange
];

const Chart: React.FC<ChartProps> = ({ data, graphType, xColumn, yColumn, groupColumn, maxY, id }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || !Array.isArray(data) || data.length === 0) {
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }
    
    // Helper function to get responsive font sizes
    const getFontSize = (mobile: number, desktop: number) => {
      return window.innerWidth < 768 ? mobile : desktop;
    };
    
    let labels: string[] = [];
    let datasets: any[] = [];
    let options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: window.innerWidth < 768 ? 'bottom' : 'top',
          labels: {
            boxWidth: getFontSize(12, 15),
            padding: getFontSize(8, 10),
            font: {
              size: getFontSize(10, 12)
            }
          }
        },
        tooltip: { 
          mode: 'index', 
          intersect: false,
          padding: getFontSize(6, 10),
          bodyFont: {
            size: getFontSize(11, 13)
          },
          titleFont: {
            size: getFontSize(11, 13)
          }
        }
      }
    };

    if (graphType === 'line' || graphType === 'bar') {
      const records = data;
      const allLabels = [...new Set(records.map(record => record[xColumn!]))].sort();
      labels = allLabels;

      if (groupColumn) {
        const groupedData = records.reduce((acc, record) => {
          const groupKey = record[groupColumn];
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(record);
          return acc;
        }, {} as Record<string, any[]>);

        datasets = Object.keys(groupedData).map((groupKey, index) => {
          const groupRecords = groupedData[groupKey];
          // Use a color from the predefined array, cycle through them
          const color = COLORS[index % COLORS.length]; 
          
          const dataPoints = allLabels.map(label => {
            const record = groupRecords.find((r: any) => r[xColumn!] === label);
            return record ? record[yColumn!] : null;
          });

          return {
            label: groupKey,
            data: dataPoints,
            backgroundColor: color.replace('1)', '0.5)'), // Lighter fill
            borderColor: color,
            borderWidth: 2,
            tension: 0.4,
            fill: false,
          };
        });
      } else {
        // For single line/bar chart, use the first color
        const color = COLORS[0]; 
        datasets = [{
          label: yColumn,
          data: records.map(record => record[yColumn!]),
          backgroundColor: color.replace('1)', '0.5)'),
          borderColor: color,
          borderWidth: 2,
          tension: 0.1,
          fill: false,
        }];
      }

      options.scales = {
        y: {
          beginAtZero: true,
          title: { 
            display: true, 
            text: yColumn,
            font: {
              size: getFontSize(11, 13)
            }
          },
          ticks: {
            font: {
              size: getFontSize(9, 11)
            }
          },
          min: 0,
          max: maxY
        },
        x: {
          type: 'time',
          time: { 
            unit: 'month', 
            tooltipFormat: 'MMM yyyy', 
            displayFormats: { month: 'MMM yyyy' } 
          },
          title: { 
            display: true, 
            text: xColumn,
            font: {
              size: getFontSize(11, 13)
            }
          },
          ticks: {
            font: {
              size: getFontSize(9, 11)
            },
            maxRotation: getFontSize(45, 0),
            minRotation: getFontSize(45, 0)
          }
        }
      };

    } else if (graphType === 'pie' || graphType === 'donut') {
      // For pie charts with groupColumn, aggregate by group (e.g., insurance)
      if (groupColumn) {
        // Group data and calculate average or sum per group
        const groupedData = data.reduce((acc, record) => {
          const groupKey = record[groupColumn];
          if (!acc[groupKey]) {
            acc[groupKey] = { sum: 0, count: 0 };
          }
          acc[groupKey].sum += record[yColumn!] || 0;
          acc[groupKey].count += 1;
          return acc;
        }, {} as Record<string, { sum: number; count: number }>);

        labels = Object.keys(groupedData);
        const pieData = labels.map(key => groupedData[key].sum / groupedData[key].count);
        const backgroundColors = labels.map((_, index) => COLORS[index % COLORS.length]);
        
        datasets = [{
          label: yColumn,
          data: pieData,
          backgroundColor: backgroundColors,
          hoverOffset: 4
        }];
      } else {
        // Without groupColumn, show individual data points
        const pieData = data.map(item => item[yColumn!]);
        const pieLabels = data.map(item => item[xColumn!]);
        
        // Use predefined colors for each segment, cycling if more than 6 segments
        const backgroundColors = pieLabels.map((_, index) => COLORS[index % COLORS.length]);
        
        labels = pieLabels;
        datasets = [{
          label: yColumn,
          data: pieData,
          backgroundColor: backgroundColors,
          hoverOffset: 4
        }];
      }
    }

    chartInstanceRef.current = new ChartJS(ctx, {
      type: graphType === 'donut' ? 'doughnut' : graphType,
      data: { labels, datasets },
      options
    });
  }, [data, graphType, xColumn, yColumn, groupColumn, maxY]);

  return <canvas id={id} ref={canvasRef} />;
};

export default Chart;