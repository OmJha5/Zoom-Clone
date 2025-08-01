import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from "./utils/db.js";
import userRouter from './routes/user.routes.js';
import connectToSocket from "./controller/socketManager.js"
import cookieParser from 'cookie-parser';

dotenv.config({});

let app = express();
let server = createServer(app);
let io = connectToSocket(server);
let port = process.env.PORT || 4000;

app.use(cookieParser());

app.use(cors({
    // origin : "http://localhost:5173",
    origin : "https://zoom-clone-frontend-bupu.onrender.com",
    credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users" , userRouter);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

server.listen(port , () => {
    connectDB();
    console.log('Server is running on port 8080');
})