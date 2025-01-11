const express = require('express');
const app = express();
const { Server } = require('socket.io');
const http = require('http');
const mysql = require('mysql2');

const bodyParser = require('body-parser');

require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

const server = http.createServer(app);
const io = new Server(server);
const port = 5000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'chat_app'
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL database.");
});

// User Authentication
app.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
});

// Fetch Chat History with Pagination
app.get('/messages', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    db.query(
        "SELECT * FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        [parseInt(limit), parseInt(offset)],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json(results.reverse()); // Reverse to show oldest first
        }
    );
});

// WebSocket Connection
let onlineUsers = {};

io.on('connection', (socket) => {
    let currentUser = null;

    // Authenticate user
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            currentUser = decoded.username;
            onlineUsers[currentUser] = socket.id;

            io.emit('update users', Object.keys(onlineUsers));
            socket.emit('authenticated', { username: currentUser });
        } catch (err) {
            socket.emit('error', { message: "Authentication failed" });
            socket.disconnect();
        }
    });

    // Handle messages
    socket.on('send message', (message) => {
        if (!currentUser) return;

        const chat = { username: currentUser, chat: message };
        db.query(
            "INSERT INTO messages (username, chat) VALUES (?, ?)",
            [chat.username, chat.chat],
            (err) => {
                if (err) return console.error(err);
                io.emit('send message', { ...chat, timestamp: new Date() });
            }
        );
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (currentUser) {
            delete onlineUsers[currentUser];
            io.emit('update users', Object.keys(onlineUsers));
        }
    });
});

server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
