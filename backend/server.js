const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load environment variables from .env file
const app = express();

// 1. Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Hello from the Express server!');
});

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});