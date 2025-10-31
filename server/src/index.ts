import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Database connection test endpoint
app.get('/db-check', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        res.json({ status: 'OK', message: 'Database connection successful' });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// API Routes

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT id, name FROM users WHERE name = ?',
            [name]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
            return res.json(existingUsers[0]);
        }

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (name) VALUES (?)',
            [name]
        );

        const insertResult = result as any;
        const userId = insertResult.insertId;

        res.status(201).json({ id: userId, name });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            error: 'Failed to create user',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/messages - Get latest 50 messages
app.get('/api/messages', async (req, res) => {
    try {
        const [messages] = await pool.query(
            `SELECT 
                m.id, 
                m.user_id, 
                m.text, 
                m.created_at,
                u.name as user_name
            FROM messages m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
            LIMIT 50`
        );

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ 
            error: 'Failed to fetch messages',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/messages - Create a new message
app.post('/api/messages', async (req, res) => {
    try {
        const { user_id, text } = req.body;

        if (!user_id || !text) {
            return res.status(400).json({ error: 'user_id and text are required' });
        }

        // Insert new message
        const [result] = await pool.query(
            'INSERT INTO messages (user_id, text) VALUES (?, ?)',
            [user_id, text]
        );

        const insertResult = result as any;
        const messageId = insertResult.insertId;

        // Fetch the newly created message with user name
        const [messages] = await pool.query(
            `SELECT 
                m.id, 
                m.user_id, 
                m.text, 
                m.created_at,
                u.name as user_name
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?`,
            [messageId]
        );

        if (Array.isArray(messages) && messages.length > 0) {
            res.status(201).json(messages[0]);
        } else {
            res.status(201).json({ 
                id: messageId, 
                user_id, 
                text 
            });
        }
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ 
            error: 'Failed to create message',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
