import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import pool from './db.js';
import fetch from 'node-fetch';
import { sendPushNotification } from './utils/push.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// push helper moved to ./utils/push.ts

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// GET /api/stats - Get user statistics
app.get('/api/stats', async (req, res) => {
    try {
        // Get total registered users
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = Array.isArray(userCount) && userCount.length > 0 
            ? (userCount[0] as any).count 
            : 0;

        // Get active users count
        const activeUsersCount = activeUsers.size;

        res.json({
            totalUsers,
            activeUsers: activeUsersCount
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, created_at, last_login FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Database connection test 
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

// API 

//  generate suggested usernames
function generateSuggestedNames(baseName: string): string[] {
    const suggestions: string[] = [];
    const cleanName = baseName.replace(/\d+$/, ''); 
    
    for (let i = 1; i <= 5; i++) {
        suggestions.push(`${cleanName}${Math.floor(Math.random() * 1000)}`);
    }
    
    return suggestions;
}

// POST /api/users/check - Check if username is available
app.post('/api/users/check', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if user already exists in database
        const [existingUsers] = await pool.query(
            'SELECT id, name FROM users WHERE name = ?',
            [name]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
           
            return res.json({ 
                available: false, 
                reason: 'name_exists_in_database',
                message: 'This username already exists. Please enter your password to login.',
                requiresPassword: true
            });
        }

       
        res.json({ available: true, requiresPassword: false });
    } catch (error) {
        console.error('Error checking username:', error);
        res.status(500).json({ 
            error: 'Failed to check username',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/users/login - Login existing user with password
app.post('/api/users/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ error: 'Name and password are required' });
        }

       
        const [users] = await pool.query(
            'SELECT id, name, password, last_read_message_id FROM users WHERE name = ?',
            [name]
        );

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(404).json({ 
                error: 'User not found',
                message: 'No user found with this username.'
            });
        }

        const user = users[0] as any;

        
        if (user.password !== password) {
            return res.status(401).json({ 
                error: 'Invalid password',
                message: 'The password you entered is incorrect.'
            });
        }

       
        const isActiveInChat = Array.from(activeUsers.values()).some(
            activeUser => activeUser.userId === user.id.toString()
        );

        if (isActiveInChat) {
            return res.status(409).json({ 
                error: 'User already logged in',
                message: 'This account is already active in the chat room. Please logout from other device first.'
            });
        }

        // Update last login time
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );
        
        res.json({ 
            id: user.id, 
            name: user.name,
            last_read_message_id: user.last_read_message_id,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ 
            error: 'Failed to login',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/users -register
app.post('/api/users', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ error: 'Name and password are required' });
        }

        if (password.length < 4) {
            return res.status(400).json({ 
                error: 'Password too short',
                message: 'Password must be at least 4 characters long.'
            });
        }

      
        const [existingUsers] = await pool.query(
            'SELECT id, name FROM users WHERE name = ?',
            [name]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
           
            return res.status(409).json({ 
                error: 'Username already exists',
                message: 'This username is already registered. Please login with your password.',
                requiresPassword: true
            });
        }


        const [result] = await pool.query(
            'INSERT INTO users (name, password) VALUES (?, ?)',
            [name, password]
        );

        const insertResult = result as any;
        const userId = insertResult.insertId;

        res.status(201).json({ 
            id: userId, 
            name,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            error: 'Failed to create user',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/users/me - Get current user info 
app.get('/api/users/me', async (req, res) => {
    try {
    
        const [users] = await pool.query(
            'SELECT id, name FROM users ORDER BY last_login DESC LIMIT 1'
        );
        
        if (Array.isArray(users) && users.length > 0) {
            res.json(users[0]);
        } else {
            res.status(404).json({ error: 'No user found' });
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ 
            error: 'Failed to get user info',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/users/push-token - Save user's push notification token
app.post('/api/users/push-token', async (req, res) => {
    try {
        const { userId, pushToken } = req.body;

        if (!userId || !pushToken) {
            return res.status(400).json({ error: 'userId and pushToken are required' });
        }

     
        await pool.query(
            'UPDATE users SET push_token = ? WHERE id = ?',
            [pushToken, userId]
        );

        res.json({ message: 'Push token saved successfully' });
    } catch (error) {
        console.error('Error saving push token:', error);
        res.status(500).json({ 
            error: 'Failed to save push token',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/messages - Get latest 50 messages with read status
app.get('/api/messages', async (req, res) => {
    try {
        const userId = req.query.user_id as string;

        if (!userId) {
        
            const [messages] = await pool.query(
                `SELECT 
                    m.id, 
                    m.user_id, 
                    m.text, 
                    m.created_at,
                    u.name as user_name
                FROM messages m
                JOIN users u ON m.user_id = u.id
                ORDER BY m.created_at ASC, m.id ASC
                LIMIT 50`
            );
            return res.json(messages);
        }

       
        const [users] = await pool.query(
            'SELECT last_read_message_id FROM users WHERE id = ?',
            [userId]
        );
        
        const lastReadMessageId = Array.isArray(users) && users.length > 0 
            ? (users[0] as any).last_read_message_id 
            : null;

        // Get the last 50 messages ordered oldest to newest
        const [messages] = await pool.query(
            `SELECT * FROM (
                SELECT 
                    m.id, 
                    m.user_id, 
                    m.text, 
                    m.created_at,
                    u.name as user_name,
                    CASE 
                        WHEN m.user_id = ? THEN true
                        WHEN ? IS NULL THEN false
                        WHEN m.id <= ? THEN true
                        ELSE false
                    END as is_read
                FROM messages m
                JOIN users u ON m.user_id = u.id
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT 50
            ) as latest_messages
            ORDER BY created_at ASC, id ASC`,
            [userId, lastReadMessageId, lastReadMessageId]
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

       
        const [result] = await pool.query(
            'INSERT INTO messages (user_id, text) VALUES (?, ?)',
            [user_id, text]
        );

        const insertResult = result as any;
        const messageId = insertResult.insertId;

       
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
            const messageWithUser = messages[0] as any;
            
            // Broadcast the new message to all connected clients
            io.emit('message:new', messageWithUser);
            
            
            try {
                const [allUsers] = await pool.query(
                    'SELECT id, name, push_token FROM users WHERE id != ? AND push_token IS NOT NULL',
                    [user_id]
                );

                if (Array.isArray(allUsers) && allUsers.length > 0) {
                    const pushPromises = allUsers.map((user: any) => {
                        if (user.push_token) {
                            return sendPushNotification(
                                user.push_token,
                                `New message from ${messageWithUser.user_name}`,
                                text.substring(0, 100), 
                                { messageId: messageId, userId: user_id }
                            );
                        }
                    });
                    
                    await Promise.all(pushPromises);
                    console.log(`Sent push notifications to ${allUsers.length} users`);
                }
            } catch (pushError) {
                console.error('Error sending push notifications:', pushError);
               
            }
            
            res.status(201).json(messageWithUser);
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

// POST /api/messages/mark-read - Mark messages as read 
app.post('/api/messages/mark-read', async (req, res) => {
    try {
        const { user_id, message_id } = req.body;

        if (!user_id || !message_id) {
            return res.status(400).json({ error: 'user_id and message_id are required' });
        }

       
        await pool.query(
            'UPDATE users SET last_read_message_id = ? WHERE id = ?',
            [message_id, user_id]
        );

        res.json({ 
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ 
            error: 'Failed to mark messages as read',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Track active users in the chat room
const activeUsers = new Map<string, { userId: string; userName: string }>();

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Handle user joining the chat
    socket.on('user:join', (data: { userId: string; userName: string }) => {
        activeUsers.set(socket.id, { userId: data.userId, userName: data.userName });
        console.log(`User ${data.userName} (${data.userId}) joined the chat`);
        console.log(`Active users: ${activeUsers.size}`);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            console.log(`User ${user.userName} (${user.userId}) left the chat`);
            activeUsers.delete(socket.id);
            console.log(`Active users: ${activeUsers.size}`);
        }
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
