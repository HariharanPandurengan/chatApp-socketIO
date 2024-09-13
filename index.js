const express = require('express');
const app = express();
const expressServer = app.listen(4000)

const socketio = require('socket.io')

const io = socketio(expressServer,{
    cors: {
        origin: 'http://localhost:3000', 
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true,
      },
})

const connectedUsers = {};
io.on('connect',(socket)=>{
    console.log(socket.id,'has joined our server')

    // Store the connected user with their username
    socket.on('register', (username) => {
        connectedUsers[username] = socket.id;
        console.log(`${username} is connected with socket id ${socket.id}`);
    });

    // Handle request acceptance and notify the recipient
    socket.on('accept_request', (data) => {
        const { recipient, currentUser } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                message: `Your request has been accepted by ${currentUser}`,
            });
        } else {
            console.log('Recipient is not online.');
        }
    });

    // Handle remove_friend and notify the recipient
    socket.on('remove_friend', (data) => {
        const { recipient, currentUser } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                message: `You has been removed from friend list by ${currentUser}`,
            });
        } else {
            console.log('Recipient is not online.');
        }
    });

    // Handle remove_friend and notify the recipient
    socket.on('chat', (data) => {
        const { recipient, currentUser, message } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                for: `new chat`,
                from : currentUser,
                message:message
            });
        } else {
            console.log('Recipient is not online.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove the disconnected user from the connectedUsers list
        for (const username in connectedUsers) {
            if (connectedUsers[username] === socket.id) {
            delete connectedUsers[username];
        }
    }
    });
})