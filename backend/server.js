const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to parse JSON request bodies
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Endpoint to get chart data for gaps
app.get('/api/chart-data', authenticateToken, async (req, res) => {
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

// Endpoint to post new data for gaps
app.post('/api/gaps', authenticateToken, async (req, res) => {
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

// Endpoint to get risk score data
app.get('/api/chart-data/risk-score', authenticateToken, async (req, res) => {
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

// Endpoint to post new risk score data
app.post('/api/risk', authenticateToken, async (req, res) => {
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

// Endpoint to get earnings data
app.get('/api/chart-data/earnings', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('closure_earnings')
            .select('insurance, earnings');

        if (error) {
            console.error('Error fetching earnings data:', error.message);
            return res.status(500).json({ error: 'Failed to fetch earnings data' });
        }
        res.json(data);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.SHARED_USERNAME && password === process.env.SHARED_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid credentials' });
});

//fetch all data for the table view
app.get('/api/table-data/:tableName', authenticateToken, async (req, res) => {
    const { tableName } = req.params;
    let query = supabase.from(tableName).select('*');
    if (tableName === 'closure_percentage' || tableName === 'risk_closure') {
        query = query.order('date', { ascending: false });
    } else {
        query = query.order('id', { ascending: false });
    }
    try {
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching table data:', error.message);
            return res.status(500).json({ error: 'Failed to fetch table data' });
        }
        res.json(data);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

//delete a row from the table
app.delete('/api/table-data/:tableName/:id', authenticateToken, async (req, res) => {
    const { tableName, id } = req.params;
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting record:', error.message);
            return res.status(500).json({ error: 'Failed to delete record' });
        }
        res.status(200).json({ message: `Record with id ${id} deleted successfully.` });
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});