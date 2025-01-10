const socket = io();
let username;

// Join chat
document.getElementById('join-btn').addEventListener('click', () => {
    username = document.getElementById('username').value.trim();
    if (username) {
        socket.emit('join', username);
        document.getElementById('username').style.display = 'none';
        document.getElementById('join-btn').style.display = 'none';
        document.getElementById('chat-input').style.display = 'flex';
    }
});

// Send message
document.getElementById('send-btn').addEventListener('click', () => {
    const message = document.getElementById('message').value.trim();
    if (message) {
        socket.emit('send message', message);
        document.getElementById('message').value = '';
    }
});

// Display chat history
socket.on('chat history', (messages) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    messages.forEach(({ username, chat, timestamp }) => {
        chatBox.innerHTML += `<div><b>${username}</b> (${new Date(timestamp).toLocaleTimeString()}): ${chat}</div>`;
    });
});

// Display messages
socket.on('send message', ({ username, chat, timestamp }) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div><b>${username}</b> (${new Date(timestamp).toLocaleTimeString()}): ${chat}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});

// User joins
socket.on('user joined', (message) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div><i>${message}</i></div>`;
});

// User leaves
socket.on('user left', (message) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div><i>${message}</i></div>`;
});
