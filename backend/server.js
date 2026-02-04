const express = require('express');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process'); 
const fs = require('fs');
const Lambda = require('aws-sdk/clients/lambda');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configure Neon for production (WebSocket polyfill)
neonConfig.webSocketConstructor = ws;

// Express server for NCH dashboard API
// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

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

    // Call AWS Lambda function to process the file
    const lambda = new Lambda({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    const fileData = req.file;
    const dateParam = req.body.date;

    // Convert file to base64 string for Lambda
    const fileBuffer = fs.readFileSync(fileData.path);
    const fileBase64 = fileBuffer.toString('base64');

    const lambdaParams = {
        FunctionName: 'keyMetrics',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
            excel_file: fileBase64,
            date_param: dateParam,
            is_base64: true
        }),
    };
    
    lambda.invoke(lambdaParams, (err, data) => {
        // Delete the uploaded file after processing
        fs.unlink(fileData.path, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting uploaded file:', unlinkErr);
            }
        });

        if (err) {
            console.error('Error invoking Lambda function:', err);
            return res.status(500).json({ error: 'Failed to process file' });
        }
        
        // Parse Lambda response payload
        const payload = JSON.parse(data.Payload);
        
        // Check for Lambda execution errors
        if (payload.errorMessage) {
            console.error('Lambda execution error:', payload.errorMessage);
            return res.status(500).json({ error: 'Lambda execution failed', details: payload.errorMessage });
        }
        
        // Parse the body from Lambda response
        const responseBody = JSON.parse(payload.body);
        
        // Check Lambda function's status code
        if (payload.statusCode !== 200) {
            console.error('Lambda function error:', responseBody);
            return res.status(payload.statusCode).json(responseBody);
        }
        
        // Return the metrics directly to match the old Python process behavior
        res.json(responseBody);
    });
    // // Use python3 for production environments and full path to script
    // const pythonCommand = process.env.NODE_ENV === 'production' ? 'python3' : 'python';
    // const scriptPath = path.join(__dirname, 'lambda_excel.py');
    // const pythonProcess = spawn(pythonCommand, [scriptPath, fileData, date]);

    // let pythonOutput = '';
    // let pythonError = '';

    // pythonProcess.stdout.on('data', (data) => {
    //     pythonOutput += data.toString();
    // });

    // pythonProcess.stderr.on('data', (data) => {
    //     pythonError += data.toString();
    // });

    // pythonProcess.on('close', (code) => {
    //     // Clean up the temporary file after processing
    //     fs.unlink(filePath, (err) => {
    //         if (err) console.error('Error cleaning up file:', err);
    //     });
        
    //     if (code !== 0) {
    //         console.error('Python script failed:', pythonError);
    //         return res.status(500).json({ 
    //             error: 'Data processing failed in Python', 
    //             details: pythonError 
    //         });
    //     }
        
    //     // 4. Send the processed JSON data back
    //     try {
    //         res.json(JSON.parse(pythonOutput));
    //     } catch (e) {
    //         console.error('Failed to parse Python JSON:', e);
    //         res.status(500).json({ error: 'Invalid JSON response from processor.' });
    //     }
    // });

    
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

        const query = `INSERT INTO priority_gaps (date, diabetes, blood_pressure, breast_cancer, colo_cancer) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const values = [date, metrics.diabetes ?? null, metrics.blood_pressure ?? null, metrics.breast_cancer ?? null, metrics.colorectal_cancer ?? null];
        const result = await pool.query(query, values);

        // Return the inserted row(s) to the client
        res.status(201).json(result.rows);
    } catch (e) {
        console.error('Server error on processed data insert:', e);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// get priority gaps data
app.get('/api/chart-data/priority-gaps', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT date, diabetes, blood_pressure, breast_cancer, colo_cancer FROM priority_gaps ORDER BY date ASC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// get recent priority gaps data
app.get('/api/chart-data/priority-gaps/recent-data', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT date, diabetes, blood_pressure, breast_cancer, colo_cancer
            FROM priority_gaps 
            WHERE date >= DATE_TRUNC('month', (
                SELECT MAX(date) FROM priority_gaps
            ))
            ORDER BY date DESC
        `;
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        res.status(404).json({ error: 'No recent data found' });
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// get risk score data
app.get('/api/chart-data/risk-score', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT date, percentage, insurance FROM risk_closure ORDER BY date ASC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

//get recent data for gaps
// should get the most recent and valid months data
app.get('/api/gaps/recent-data', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT date, percentage, insurance 
            FROM closure_percentage 
            WHERE date >= DATE_TRUNC('month', (
                SELECT MAX(date) FROM closure_percentage
            ))
            ORDER BY date DESC
        `;
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        res.status(404).json({ error: 'No recent data found' });
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.get('/api/chart-data', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT date, ROUND(percentage::numeric, 2) as percentage, insurance FROM closure_percentage ORDER BY date ASC`;
        const result = await pool.query(query);
        res.json(result.rows);
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
        const query = `INSERT INTO closure_percentage (numerator, denominator, date, insurance) VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [numerator, denominator, date, insurance];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

//get recent risk score data
app.get('/api/chart-data/risk-score/recent-data', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT date, percentage, insurance 
            FROM risk_closure 
            WHERE date >= DATE_TRUNC('month', (
                SELECT MAX(date) FROM risk_closure
            ))
            ORDER BY date DESC
        `;
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        res.status(404).json({ error: 'No recent data found' });
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

//post new risk score data
app.post('/api/risk', authenticateToken, async (req, res) => {
    const { percentage, date, insurance } = req.body;
    try {
        const query = `INSERT INTO risk_closure (percentage, date, insurance) VALUES ($1, $2, $3) RETURNING *`;
        const values = [percentage, date, insurance];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

//get earnings data
app.get('/api/chart-data/earnings', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT insurance, earnings FROM closure_earnings`;
        const result = await pool.query(query);
        res.json(result.rows);
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
        const query = `INSERT INTO pt_outreach (numerator, denominator, date, insurance) VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [numerator, denominator, date, insurance];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});


//get outreach data
app.get('/api/chart-data/outreach', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT date, ROUND(percentage::numeric, 2) as percentage, insurance FROM pt_outreach ORDER BY date ASC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// get recent outreach data
app.get('/api/chart-data/outreach/recent-data', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT date, ROUND(percentage::numeric, 2) as percentage, insurance 
            FROM pt_outreach 
            WHERE date >= DATE_TRUNC('month', (
                SELECT MAX(date) FROM pt_outreach
            ))
            ORDER BY date DESC
        `;
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        res.status(404).json({ error: 'No recent data found' });
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
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
    let orderBy = (tableName === 'closure_percentage' || tableName === 'risk_closure') ? 'date DESC' : 'id DESC';
    
    let query;
    if (tableName === 'closure_percentage' || tableName === 'risk_closure' || tableName === 'pt_outreach') {
        query = `SELECT id, ROUND(percentage::numeric, 2) as percentage, date, insurance FROM ${tableName} ORDER BY ${orderBy}`;
    } else {
        query = `SELECT * FROM ${tableName} ORDER BY ${orderBy}`;
    }
    
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

//delete a row from the table
app.delete('/api/table-data/:tableName/:id', authenticateToken, async (req, res) => {
    const { tableName, id } = req.params;
    try {
        const query = `DELETE FROM ${tableName} WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Record not found' });
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