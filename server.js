const express = require('express');
const app = express();
const { Server } = require('socket.io');
const http = require('http');
const mysql = require('mysql2');
const path = require('path');
const server = http.createServer(app);
const io = new Server(server);
const port = 5000;

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat_app'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database.');
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Send index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Fetch chat history on connection
    db.query('SELECT * FROM messages ORDER BY timestamp ASC', (err, results) => {
        if (err) throw err;
        socket.emit('chat history', results);
    });

    // User joins
    socket.on('join', (username) => {
        socket.username = username;
        io.emit('user joined', `${username} has joined the chat`);
    });

    // New message
    socket.on('send message', (chat) => {
        const timestamp = new Date().toISOString();
        const message = { username: socket.username, chat, timestamp };
        
        // Broadcast message
        io.emit('send message', message);

        // Save to database
        db.query('INSERT INTO messages SET ?', message, (err) => {
            if (err) throw err;
        });
    });

    // User disconnects
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('user left', `${socket.username} has left the chat`);
        }
    });
});

// Start server
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
