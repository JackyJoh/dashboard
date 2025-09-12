import { useState, useEffect } from 'react';
import Chart from './Chart';
import Layout from './Layout'; // Import the new Layout component
import Grid from './Grid'; // Import Grid
import './styles.css'; 
import { Routes, Route } from 'react-router-dom';
import Gaps from './Gaps';


// Define a type for the data you expect from the API.
interface ChartData {
  date: string;
  percentage: number;
  insurance: string;
}

function App() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from our Express API endpoint
    fetch('/api/chart-data')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setChartData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch chart data:', error);
        setError('Failed to load chart data.');
        setLoading(false);
      });
  }, []);

  // Now you can render based on the state
  if (loading) {
    return <div>Loading chart data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }


return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout showHeader={true}>
            <Grid>
              {/* Existing dashboard content */}
              <div className="card-white">
                <div style={{ width: '100%', height: '100%' }}>
                  <Chart data={chartData} />
                </div>
              </div>
              <div className="card-green">
                <p className="text-xl font-semibold text-green-800">
                  <strong>Risk Score</strong>
                </p>
              </div>
              <div className="card-purple">
                <div style={{ width: '100%', height: '100%' }}>
                  <Chart data={chartData} />
                </div>
              </div>
              <div className="card-red">
                <div className="card-subgrid">
                  <div className="card-subgrid-item">
                    <p className="text-xl font-semibold text-red-800">
                      Insurance Pie Chart
                    </p>
                  </div>
                  <div className="card-subgrid-item">
                    <p className="text-xl font-semibold text-red-800">
                      Other Metric
                    </p>
                  </div>
                </div>
              </div>
            </Grid>
          </Layout>
        }
      />
      <Route path="/gaps" element={<Gaps />} />
    </Routes>
  );
}

export default App;