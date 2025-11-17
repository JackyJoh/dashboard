const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process'); 
const fs = require('fs'); // Node.js built-in file system module
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create express app   
const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON request bodies
app.use(express.json());


const PORT = process.env.PORT || 5000;

// Setup file upload directory
const uploadPath = process.env.NODE_ENV === 'production' ? '/tmp/' : 'uploads/';
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use a unique name to prevent conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.xlsx');
    }
});

// Configure multer to use the custom storage settings
const uploadHandler = multer({ storage: storage });

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


// Endpoint to handle file upload and processing
app.post('/api/priority-gaps', authenticateToken, uploadHandler.single('excelFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!req.body.date) {
        return res.status(400).json({ error: 'No date provided' });
    }
    const filePath = req.file.path;
    const date = req.body.date; // Get date from the request body
    
    // Use python3 for production environments and full path to script
    const pythonCommand = process.env.NODE_ENV === 'production' ? 'python3' : 'python';
    const scriptPath = path.join(__dirname, 'excel_processor.py');
    const pythonProcess = spawn(pythonCommand, [scriptPath, filePath, date]);

    let pythonOutput = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
    });

    pythonProcess.on('close', (code) => {
        // Clean up the temporary file after processing
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error cleaning up file:', err);
        });
        
        if (code !== 0) {
            console.error('Python script failed:', pythonError);
            return res.status(500).json({ 
                error: 'Data processing failed in Python', 
                details: pythonError 
            });
        }
        
        // 4. Send the processed JSON data back
        try {
            res.json(JSON.parse(pythonOutput));
        } catch (e) {
            console.error('Failed to parse Python JSON:', e);
            res.status(500).json({ error: 'Invalid JSON response from processor.' });
        }
    });
});

// second route for processed data
app.post('/api/priority-gaps/processed', authenticateToken, async (req, res) => {
    // Expecting { date: string, metrics: { diabetes, blood_pressure, breast_cancer, colorectal_cancer } }
    const { date, metrics } = req.body;

    if (!date || !metrics) {
        return res.status(400).json({ error: 'Invalid data. Date and metrics are required.' });
    }

    try {
        // Map incoming keys to the database column names.
        const insertObj = {
            date: date,
            diabetes: metrics.diabetes ?? null,
            blood_pressure: metrics.blood_pressure ?? null,
            breast_cancer: metrics.breast_cancer ?? null,
            colo_cancer: metrics.colorectal_cancer ?? null,
        };

        const { data, error } = await supabase
            .from('priority_gaps')
            .insert([insertObj])
            .select();

        if (error) {
            console.error('Error inserting processed data:', error.message);
            return res.status(500).json({ error: 'Failed to save processed data.' });
        }
        // Return the inserted row(s) to the client
        res.status(201).json(data);
    } catch (e) {
        console.error('Server error on processed data insert:', e);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// get priority gaps data
app.get('/api/chart-data/priority-gaps', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('priority_gaps')
            .select('date, diabetes, blood_pressure, breast_cancer, colo_cancer')
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

// get recent priority gaps data
app.get('/api/chart-data/priority-gaps/recent-data', authenticateToken, async (req, res) => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;
    let attempts = 0;
    while (attempts < 12) {
        try {
            // Calculate next month for the upper bound
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear = currentYear + 1;
            }

            const { data, error } = await supabase
                .from('priority_gaps')
                .select('date, percentage, insurance')
                .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
                .lt('date', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
            
            if (error) {
                console.error('Error fetching recent data from Supabase:', error.message);
                return res.status(500).json({ error: 'Failed to fetch recent data' });
            }
            if (data && data.length > 0) {
                return res.json(data);
            }
            // No data? Go back a month
            currentMonth--;
            if (currentMonth < 1) {
                currentMonth = 12;
                currentYear--;
            }
            attempts++;
        } catch (e) {
            console.error('Server error:', e);
            return res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
    res.status(404).json({ error: 'No recent data found in the past year' });
});

// get risk score data
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

//get recent data for gaps
// should get the most recent and valid months data
app.get('/api/gaps/recent-data', authenticateToken, async (req, res) => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;
    let attempts = 0;
    while (attempts < 12) {
        try {
            // Calculate next month for the upper bound
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear = currentYear + 1;
            }

            const { data, error } = await supabase
                .from('closure_percentage')
                .select('date, percentage, insurance')
                .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
                .lt('date', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
            
            if (error) {
                console.error('Error fetching recent data from Supabase:', error.message);
                return res.status(500).json({ error: 'Failed to fetch recent data' });
            }
            if (data && data.length > 0) {
                return res.json(data);
            }
            // No data? Go back a month
            currentMonth--;
            if (currentMonth < 1) {
                currentMonth = 12;
                currentYear--;
            }
            attempts++;
        } catch (e) {
            console.error('Server error:', e);
            return res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
    res.status(404).json({ error: 'No recent data found in the past year' });
});

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


//Endpoint to post new data for gaps
app.post('/api/gaps', authenticateToken, async (req, res) => {
    const { percentage, date, insurance } = req.body;
    
    // Parse numerator/denominator from percentage string (format: "numerator/denominator")
    const parts = percentage.split('/');
    if (parts.length !== 2) {
        return res.status(400).json({ error: 'Percentage must be in format "numerator/denominator"' });
    }
    
    const numerator = parseInt(parts[0].trim(), 10);
    const denominator = parseInt(parts[1].trim(), 10);
    
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return res.status(400).json({ error: 'Invalid numerator/denominator values' });
    }
    
    try {
        const { data, error } = await supabase
            .from('closure_percentage')
            .insert([{ numerator, denominator, date, insurance }])
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

//get recent risk score data
app.get('/api/chart-data/risk-score/recent-data', authenticateToken, async (req, res) => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;
    let attempts = 0;
    while (attempts < 12) {
        try {
            // Calculate next month for the upper bound
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear = currentYear + 1;
            }

            const { data, error } = await supabase
                .from('risk_closure')
                .select('date, percentage, insurance')
                .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
                .lt('date', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
            
            if (error) {
                console.error('Error fetching recent data from Supabase:', error.message);
                return res.status(500).json({ error: 'Failed to fetch recent data' });
            }
            if (data && data.length > 0) {
                return res.json(data);
            }
            // No data? Go back a month
            currentMonth--;
            if (currentMonth < 1) {
                currentMonth = 12;
                currentYear--;
            }
            attempts++;
        } catch (e) {
            console.error('Server error:', e);
            return res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
    res.status(404).json({ error: 'No recent data found in the past year' });
});

//post new risk score data
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

//get earnings data
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

//post new outreach data
app.post('/api/outreach', authenticateToken, async (req, res) => {
    const { percentage, date, insurance } = req.body;
    
    // Parse numerator/denominator from percentage string (format: "numerator/denominator")
    const parts = percentage.split('/');
    if (parts.length !== 2) {
        return res.status(400).json({ error: 'Percentage must be in format "numerator/denominator"' });
    }
    
    const numerator = parseInt(parts[0].trim(), 10);
    const denominator = parseInt(parts[1].trim(), 10);
    
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return res.status(400).json({ error: 'Invalid numerator/denominator values' });
    }
    
    try {
        const { data, error } = await supabase
            .from('pt_outreach')
            .insert([{ numerator, denominator, date, insurance }])
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


//get outreach data
app.get('/api/chart-data/outreach', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pt_outreach')
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

// get recent outreach data
app.get('/api/chart-data/outreach/recent-data', authenticateToken, async (req, res) => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;
    let attempts = 0;
    while (attempts < 12) {
        try {
            // Calculate next month for the upper bound
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear = currentYear + 1;
            }

            const { data, error } = await supabase
                .from('pt_outreach')
                .select('date, percentage, insurance')
                .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
                .lt('date', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
            
            if (error) {
                console.error('Error fetching recent data from Supabase:', error.message);
                return res.status(500).json({ error: 'Failed to fetch recent data' });
            }
            if (data && data.length > 0) {
                return res.json(data);
            }
            // No data? Go back a month
            currentMonth--;
            if (currentMonth < 1) {
                currentMonth = 12;
                currentYear--;
            }
            attempts++;
        } catch (e) {
            console.error('Server error:', e);
            return res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
    res.status(404).json({ error: 'No recent data found in the past year' });
});

//Login endpoint
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