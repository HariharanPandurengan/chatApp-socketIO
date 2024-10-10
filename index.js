const express = require('express');
const app = express();
const expressServer = app.listen(4000)

const socketio = require('socket.io')

const io = socketio(expressServer,{
    cors: {
        origin: '*', 
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true,
      },
})

const connectedUsers = {};
const faceToFace = {};
io.on('connect',(socket)=>{
    console.log(socket.id,'has joined our server')

    // Store the connected user with their username
    socket.on('register', (username) => {
        connectedUsers[username] = socket.id;
        console.log(`${username} is connected with socket id ${socket.id}`);

        // send online notifi to opposite user in our chat
        for(let key in faceToFace){
            if (faceToFace[key] === username) {
                io.to(connectedUsers[key]).emit('onlineCheck', {
                    check : true,
                });
            } 
        }
        
    });

    // Handle faceToFace and notify the recipient
    socket.on('faceToFace', (data) => {
        const { opposite_user,user } = data;
        faceToFace[user] = opposite_user

        // send online notifi to opposite user in our chat
        for(let key in faceToFace){
            if (faceToFace[key] === user) {
                io.to(connectedUsers[key]).emit('faceToFace', {
                    ftf : true,
                });
            } 
        }
    });

    // Handle faceToFace and notify the recipient
    socket.on('firstfaceToFace', (data) => {
        const { user,opposite_user } = data;
        if(opposite_user in faceToFace && faceToFace[opposite_user] === user){
            io.to(connectedUsers[opposite_user]).emit('firstfaceToFace', {
                check : true,
            });
        }
    });

    // Handle send request and notify the recipient
    socket.on('send_request', (data) => {
        const { recipient, currentUser } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                message: `you have a new friend request : ${currentUser}`,
            });
        } else {
            // console.log('Recipient is not online.');
        }
    });

    // Handle request acceptance and notify the recipient
    socket.on('accept_request', (data) => {
        const { recipient, currentUser } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                message: `Your request has been accepted by ${currentUser}`,
            });
        } else {
            // console.log('Recipient is not online.');
        }
    });

    // Handle remove_friend and notify the recipient
    socket.on('remove_friend', (data) => {
        const { recipient, currentUser } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                message: `You are removed from friend list by ${currentUser}`,
            });
        } else {
            // console.log('Recipient is not online.');
        }
    });

    // Handle chat and notify the recipient
    socket.on('chat', (data) => {
        const { recipient, currentUser, message } = data;
        if (connectedUsers[recipient]) {
            io.to(connectedUsers[recipient]).emit('notification', {
                for: "new chat",
                from : currentUser,
                message:message
            });
        } else {
            // console.log('Recipient is not online.');
        }
    });

    // Handle group chat and notify the recipient
    socket.on('group_chat', (data) => {
        const { groupID, groupName , recipients , currentUser, message } = data;
        recipients.forEach(item=>{
            if (connectedUsers[item]) {
                io.to(connectedUsers[item]).emit('notification', {
                    for: "group chat",
                    from : currentUser,
                    message:message,
                    groupName:groupName,
                    groupID:groupID
                });
            } else {
                // console.log('Recipient is not online.');
            }
        })
    });

    // Handle new group and notify the recipient
    socket.on('new_group', (data) => {
        const { recipients , currentUser, groupName } = data;
        recipients.forEach(item=>{
            if (connectedUsers[item]) {
                io.to(connectedUsers[item]).emit('notification', {
                    for: "new group",
                    from : currentUser,
                    groupName:groupName,
                });
            } else {
                // console.log('Recipient is not online.');
            }
        })
    });

    // Handle new group and notify the recipient
    socket.on('opposite_user_in_ftf', (data) => {
        const { user , opposite_user } = data;
        if (opposite_user in faceToFace && faceToFace[opposite_user] === user) {
            io.to(connectedUsers[user]).emit('faceToFace', {
                ftf : true,
            });
        } else {
            io.to(connectedUsers[user]).emit('faceToFace', {
                ftf : false,
            });
        }
    });

    // Handle online check and notify the user
    socket.on('onlineCheck', (data) => {
        const { user , opposite_user } = data;
        if (opposite_user in connectedUsers) {
            io.to(connectedUsers[user]).emit('onlineCheck', {
                check : true,
            });
        } else {
            io.to(connectedUsers[user]).emit('onlineCheck', {
                check : false,
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove the disconnected user from the connectedUsers list
        for (const username in connectedUsers) {
            if (connectedUsers[username] === socket.id) {
                delete connectedUsers[username];

                if(username in faceToFace){
                    delete faceToFace[username]
                }

                // send online notifi to opposite user in our chat
                for(let key in faceToFace){
                    if (faceToFace[key] === username) {
                        io.to(connectedUsers[key]).emit('onlineCheck', {
                            check : false,
                        });

                        io.to(connectedUsers[key]).emit('faceToFace', {
                            ftf : false,
                        });
                    } 
                }

            }
        }
    });
})