import { User } from "../models/user.models.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let register = async(req , res) => {
    try{
        let {name , username , password} = req.body;
        
        if(!name || !username || !password){
            return res.status(400).json({
                message: "Please fill all the fields",
                success: false
            });
        }

        let existingUser = await User.findOne({ username });
        if(existingUser){   
            return res.status(400).json({
                message: "User already exists",
                success: false
            });
        }

        let hashedPassword = await bcrypt.hash(password, 10);
        let user = await User.create({
            name,
            username,
            password: hashedPassword
        });

        let tokenData = {
            username : user.username,
            name : user.name,
            id : user._id
        }

        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '7d' });

        return res.status(200).cookie("zoomToken" , token , {maxAge : 7 * 24 * 60 * 60 * 1000 , httpOnly : true , sameSite : process.env.NODE_ENV == "production" ? "none" : "lax" , secure:process.env.NODE_ENV == "production"}).json({
            message : "User registered successfully",
            success : true,
            user
        })
    }
    catch(e){
        return res.status(400).json({
            message : "Internal Server Error",
            success : false
        })
    }
}

let login = async(req , res) => {
    try{
        let {username , password} = req.body;

        if(!username || !password){
            return res.status(400).json({
                message: "Please fill all the fields",
                success: false
            });
        }

        let user = await User.findOne({ username });
        if(!user){
            return res.status(400).json({
                message: "User does not exist",
                success: false
            });
        }

        let isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({
                message: "Invalid credentials",
                success: false
            });
        }

        let tokenData = {
            username : user.username,
            name : user.name,
            id : user._id
        }

        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '7d' });

        return res.status(200).cookie("zoomToken" , token , {maxAge : 7 * 24 * 60 * 60 * 1000 , httpOnly : true , sameSite : process.env.NODE_ENV == "production" ? "none" : "lax" , secure:process.env.NODE_ENV == "production"}).json({
            message : "User logged in successfully",
            success : true,
            user
        })
    }
    catch(e){
        return res.status(400).json({
            message : "Internal Server Error",
            success : false
        })
    }
};

let checkUser = async(req , res) => {
    try{
        let token = req?.cookies?.zoomToken

        if(!token){
            return res.status(401).json({
                message : "User not Authenticated!",
                success : false
            })
        }

        const decode =  jwt.verify(token , process.env.SECRET_KEY)
        if(!decode){
            return res.status(401).json({
                message : "Invalid Token",
                success : false
            })
        }

        let id = decode.id;
        let user = await User.findById(id);

        return res.status(200).json({
            user,
            success : true
        })
    }
    catch(e){
        console.log(e);
        return res.status(400).json({
            message : "Internal Server Error",
            success : false
        })
    }
}

export {register, login , checkUser};