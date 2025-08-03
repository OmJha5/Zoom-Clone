import { Server } from "socket.io";

let connections = {}
let messages = {}
let timeOnline = {}

export default function connectToSocket(server) {
    const io = new Server(server, {
        cors: {
            // origin: "http://localhost:5173",
            origin : "https://zoom-clone-frontend-bupu.onrender.com",
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        // When a new user joins the call
        socket.on("join-call", (path) => {
            if (connections[path] == undefined) connections[path] = [];
            connections[path].push(socket.id);

            timeOnline[socket.id] = new Date();

            connections[path].forEach(elm => {
                io.to(elm).emit("user-joined", socket.id, connections[path]);
            })

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }


        })

        // When a user wants to talk to another user
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        // When a user sends a message
        socket.on("chat-message", (data, sender) => {
            // First we have to find out this socket.id is in which room ?
            let matchingRoom = '';
            let found = false;
            for (const [roomKey, roomValue] of Object.entries(connections)) {
                if (roomValue.includes(socket.id)) {
                    matchingRoom = roomKey;
                    found = true;
                    break;
                }
            }

            if (found) {
                if (messages[matchingRoom] == undefined) messages[matchingRoom] = [];
                messages[matchingRoom].push({
                    "data": data,
                    "sender": sender,
                    'socket-id-sender': socket.id
                });

                connections[matchingRoom].forEach(elm => {
                    io.to(elm).emit("chat-message", data, sender, socket.id);
                })

            }

        })

        // Triggered automatically when a client loses connection, closes the tab, or refreshes.
        // You don’t need to emit it manually — Socket.IO handles it for you.
        socket.on("disconnect", () => {
            let matchingRoom = '';
            let found = false;
            for (const [roomKey, roomValue] of Object.entries(connections)) {
                if (roomValue.includes(socket.id)) {
                    matchingRoom = roomKey;
                    found = true;
                    break;
                }
            }

            if (found) {
                connections[matchingRoom] = connections[matchingRoom].filter(elm => elm !== socket.id);
                connections[matchingRoom].forEach(elm => {
                    io.to(elm).emit("user-left", socket.id);
                })

                if (connections[matchingRoom].length === 0) {
                    delete connections[matchingRoom];
                    delete messages[matchingRoom];
                }
            }
        })

        socket.on("force-update", (to) => {
            socket.to(to).emit("force-update" , socket.id);
        })


    });

    return io;
}