import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';

ChartJS.register(...registerables);

// Define a type for the data you expect. This is a good practice in TypeScript.
interface ChartDataRecord {
  date: string;
  percentage: number;
  insurance: string;
}

interface ChartProps {
  data: ChartDataRecord[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  // useRef is a React hook that holds a reference to a DOM element (like our canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) {
      return;
    }

    // Destroy the previous chart instance before creating a new one
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    // This is where we will replicate the logic from your original HTML file
    // to group data and create datasets.
    const groupedData = data.reduce((acc, record) => {
      const groupKey = record.insurance;
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(record);
      return acc;
    }, {} as Record<string, ChartDataRecord[]>);

    const labels = [...new Set(data.map(record => record.date))].sort();

    const datasets = Object.keys(groupedData).map(groupKey => {
      const groupRecords = groupedData[groupKey];
      const randomColor = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;

      const dataPoints = labels.map(date => {
        const record = groupRecords.find(r => r.date === date);
        return record ? record.percentage : null;
      });

      return {
        label: groupKey,
        data: dataPoints,
        backgroundColor: randomColor.replace('1)', '0.5)'),
        borderColor: randomColor,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      };
    });

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Percentage' },
            min: 0,
            max: 1
          },
          x: {
            type: 'time',
            time: { unit: 'month', tooltipFormat: 'MMM yyyy', displayFormats: { month: 'MMM yyyy' } },
            title: { display: true, text: 'Date' }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false }
        }
      },
    });
  }, [data]); // The dependency array ensures the chart re-renders when the data prop changes

  return <canvas ref={canvasRef} />;
};

export default Chart;