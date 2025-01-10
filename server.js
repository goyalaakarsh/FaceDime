import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';

const app = express();
const io = new Server({
    cors: true,
});
app.use(bodyParser.json());

const userToSocketMapping = new Map();
const roomToUsers = new Map();

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('join', (data) => {
        const { room, user } = data;
        socket.join(room);
        userToSocketMapping.set(user, socket.id);
        
        if (!roomToUsers.has(room)) {
            roomToUsers.set(room, new Set());
        }
        roomToUsers.get(room).add(user);

        // Broadcast to others in room
        socket.to(room).emit('user-joined', { user });
        
        // Confirm join to the user
        socket.emit('joined', { room, user });
        
        console.log(`${user} joined room ${room}. Users:`, Array.from(roomToUsers.get(room)));
    });

    socket.on('ready', ({ room }) => {
        socket.to(room).emit('peer-ready', { socketId: socket.id });
    });

    socket.on('call-user', (data) => {
        const { room, user, offer } = data;
        console.log('Call user:', user, 'in room:', room);
        socket.to(room).emit('incoming-call', {
            from: Array.from(roomToUsers.get(room))
                .find(u => userToSocketMapping.get(u) === socket.id),
            offer
        });
    });

    socket.on('call-accepted', (data) => {
        const { room, answer } = data;
        console.log('Call accepted in room:', room);
        socket.to(room).emit('call-accepted', { answer });
    });

    socket.on('ice-candidate', (data) => {
        const { room, candidate } = data;
        console.log('ICE candidate for room:', room);
        socket.to(room).emit('ice-candidate', { candidate });
    });

    socket.on('disconnect', () => {
        // Clean up user mappings
        for (const [user, id] of userToSocketMapping.entries()) {
            if (id === socket.id) {
                userToSocketMapping.delete(user);
                break;
            }
        }
        console.log('Client disconnected');
    });
});

io.listen(3002);
app.listen(3001, () => {
    console.log('Server running on port 3001');
});