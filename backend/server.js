const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken'); // Import JWT
require('dotenv').config(); // Load environment variables from .env file
const app = express();

// 1. Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

const PORT = process.env.PORT || 5000;

//Base test get
app.get('/', (req, res) => {
    res.send('Hello from the Express server!');
});

//Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Simple check for shared credentials
  if (username === process.env.SHARED_USERNAME && password === process.env.SHARED_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

//Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}


// Endpoint to fetch chart data for gaps
app.get('/api/chart-data', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('closure_percentage')
      .select('date, percentage, insurance')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching data from Supabase:', error.message);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    res.json(data);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});


app.post('/api/gaps', async (req, res) => {
    const { percentage, date, insurance } = req.body;
    try {
        const { data, error } = await supabase
            .from('closure_percentage')
            .insert([{ percentage, date, insurance }])
            .select();

        if (error) {
            console.error('Error inserting data:', error.message);
            return res.status(500).json({ error: 'Failed to insert new record' });
        }
        res.status(201).json(data);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});


// New endpoint for risk score data
app.get('/api/chart-data/risk-score', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risk_closure')
      .select('date, percentage, insurance')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching data from Supabase:', error.message);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    res.json(data);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

app.post('/api/risk', async (req, res) => {
    const { percentage, date, insurance } = req.body;
    try {
        const { data, error } = await supabase
            .from('risk_closure')
            .insert([{ percentage, date, insurance }])
            .select();

        if (error) {
            console.error('Error inserting data:', error.message);
            return res.status(500).json({ error: 'Failed to insert new record' });
        }
        res.status(201).json(data);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});