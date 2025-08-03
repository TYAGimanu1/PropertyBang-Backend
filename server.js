import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // Updated to connect to the `postgres` database
  password: 'root',
  port: 5432,
  schema: 'public', // Explicitly set schema to public
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

// \d users