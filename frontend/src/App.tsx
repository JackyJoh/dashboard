import { useState, useEffect } from 'react';
import Chart from './Chart';
import Layout from './Layout'; // Import the new Layout component
import Grid from './Grid'; // Import Grid
import './styles.css'; 
import { Routes, Route } from 'react-router-dom';
import Gaps from './Gaps';
import RiskScore from './RiskScore'; // Import the new component


// Define a type for the data you expect from the API.
interface GapsChartData {
  date: string;
  percentage: number;
  insurance: string;
}

interface riskChartData {
  date: string;
  percentage: number;
  insurance: string;
}

function App() {
  const [GapschartData, setChartData] = useState<GapsChartData[]>([]);
  const [riskchartData, setriskChartData] = useState<riskChartData[]>([]);
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
        console.error('Failed to fetch gap chart data:', error);
        setError('Failed to load gap chart data.');
        setLoading(false);
      });

    // Fetch data for risk score chart
      fetch('/api/chart-data/risk-score')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setriskChartData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch risk chart data:', error);
        setError('Failed to load risk chart data.');
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
                  <h4 >Care Gap Closure Over Time</h4>
                  <Chart data={GapschartData} maxY={100} graphType='line'/>
                </div>
              </div>
              <div className="card-green">
                <p className="text-xl font-semibold text-green-800">
                  <strong>Risk Score</strong>
                </p>
              </div>
              <div className="card-white">
                <div style={{ width: '100%', height: '100%' }}>
                  <h4 >Risk Score Over Time</h4>
                  <Chart data={riskchartData} maxY={70} graphType='bar'/>
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
      <Route path = "/risk" element = {<RiskScore />} />
    </Routes>
  );
}

export default App;