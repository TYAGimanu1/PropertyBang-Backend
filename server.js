import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  // NOTE: This line requires the 'dotenv' package to be installed.
  // This is a common practice for local development and will not affect the production environment on Render.
  // To install, run: `npm install dotenv` in your backend project directory.
  // You do not need to commit the `.env` file itself.
  const dotenv = await import('dotenv');
  dotenv.config();
}

const app = express();
// Use process.env.PORT for Render, and fall back to 5000 for local development
const port = process.env.PORT || 5000;

// Middleware
// Restrict CORS to your deployed frontend URL for security in production.
const allowedOrigins = [
  'https://tyagimanu1.github.io', // Your GitHub Pages base domain
  'https://tyagimanu1.github.io/PropertyBang', // Your specific GitHub Pages project URL
  'http://localhost:4000', // For local development of your React app
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
}));

app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  // Use the connection string provided by Render via the DATABASE_URL environment variable.
  // This is a crucial change to connect to your deployed database instead of localhost.
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Required for Render's managed PostgreSQL to work correctly.
    rejectUnauthorized: false
  }
});

// A test connection to confirm the database is reachable
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Successfully connected to the PostgreSQL database!');
    done();
  }
});


// API endpoint to fetch items
app.get('/items', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, owner, phone, price, iname, description, image, image_1, carpet_area, floor, facing, transaction_type,type,image2,image3, ownermail,status, furnished_status, address, bedroom, project FROM items');
        console.log('Query result:', result.rows); // Debug log to inspect query result
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// API endpoint to fetch a single item by ID
app.get('/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Fetching item with ID:', id); // Debug log
        const item = await pool.query(
            'SELECT owner,ownermail, phone, price, iname, description, image, image_1, image2, image3, carpet_area, floor, facing, transaction_type, status, furnished_status, address, bedroom,type, project FROM items WHERE id = $1',
            [id]
        );
        console.log('Query result:', item.rows);
        if (item.rows.length === 0) {
            return res.status(404).send('Item not found');
        }
        res.json(item.rows[0]);
    } catch (error) {
        console.error('Error fetching item:', {
            message: error.message,
            stack: error.stack,
            query: 'SELECT ... FROM items WHERE id = $1',
            parameters: [id]
        });
        res.status(500).send('Server error');
    }
});

// API endpoint to handle user registration
app.post('/register', async (req, res) => {
    const { username, password, name, surname, dob, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO public.users (username, password, name, surname, dob, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, password, name, surname, dob, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error during registration:', {
            message: err.message,
            stack: err.stack,
            query: 'INSERT INTO public.users (username, password, name, surname, dob, email)',
            parameters: { username, password, name, surname, dob, email }
        });
        res.status(500).send('Server error');
    }
});

// API endpoint to handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (err) {
        console.error('Error during login:', {
            message: err.message,
            stack: err.stack,
        });
        res.status(500).send('Server error');
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the Items API!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});