import fetch from 'node-fetch';
import { Pool } from 'pg';

const testRegistration = async () => {
    const sampleUser = {
        username: 'testuser',
        password: 'password123',
        name: 'John',
        surname: 'Doe',
        dob: '1990-01-01',
        email: 'testuser@example.com'
    };

    try {
        // Send POST request to /register endpoint
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleUser),
        });

        if (response.ok) {
            console.log('Registration successful!');
        } else {
            console.error('Registration failed with status:', response.status);
        }

        // Verify the user in the database
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: 'root',
            port: 5432,
        });

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [sampleUser.username]);
        if (result.rows.length > 0) {
            console.log('User found in database:', result.rows[0]);
        } else {
            console.error('User not found in database.');
        }

        await pool.end();
    } catch (error) {
        console.error('Error during test:', error);
    }
};

testRegistration();
