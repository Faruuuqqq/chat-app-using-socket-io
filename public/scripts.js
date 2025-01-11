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

// Login
document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('login-username').value.trim();
    if (!username) return alert('Username is required!');

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
        .then((response) => response.json())
        .then((data) => {
            token = data.token;
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('chat-app').classList.remove('hidden');
            socket.emit('authenticate', token);
            loadMessages();
        })
        .catch((err) => console.error(err));
});

// Load Messages
function loadMessages(page = 1) {
    fetch(`/messages?page=${page}`)
        .then((res) => res.json())
        .then((messages) => {
            const chatBox = document.getElementById('chat-box');
            messages.forEach((msg) => {
                const div = document.createElement('div');
                div.textContent = `${msg.username}: ${msg.chat}`;
                chatBox.prepend(div);
            });
        });
}

// Online Users
socket.on('update users', (users) => {
    const userList = document.getElementById('online-users');
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
});

// Handle incoming messages
socket.on('send message', (message) => {
    const chatBox = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.textContent = `${message.username}: ${message.chat}`;
    chatBox.appendChild(div);
});
