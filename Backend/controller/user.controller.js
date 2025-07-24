import { User } from "../models/user.models.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let register = async(req , res) => {
    try{
        let {name , username , password} = req.body;
        
        if(!name || !username || !password){
            return res.json({
                message: "Please fill all the fields",
                success: false
            });
        }

        let existingUser = await User.findOne({ username });
        if(existingUser){   
            return res.json({
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
        }

        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '7d' });

        return res.status(200).cookie("zoomToken" , token , {maxAge : 7 * 24 * 60 * 60 * 1000 , httpOnly : true , sameSite : process.env.NODE_ENV == "production" ? "none" : "lax" , secure:process.env.NODE_ENV == "production"}).json({
            message : "User registered successfully",
            success : true,
            user
        })
    }
    catch(e){
        return res.json({
            message : "Internal Server Error",
            success : false
        })
    }
}

let login = async(req , res) => {
    try{
        let {username , password} = req.body;

        if(!username || !password){
            return res.json({
                message: "Please fill all the fields",
                success: false
            });
        }

        let user = await User.findOne({ username });
        if(!user){
            return res.json({
                message: "User does not exist",
                success: false
            });
        }

        let isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.json({
                message: "Invalid credentials",
                success: false
            });
        }

        let tokenData = {
            username : user.username,
            name : user.name,
        }

        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '7d' });

        return res.status(200).cookie("zoomToken" , token , {maxAge : 7 * 24 * 60 * 60 * 1000 , httpOnly : true , sameSite : process.env.NODE_ENV == "production" ? "none" : "lax" , secure:process.env.NODE_ENV == "production"}).json({
            message : "User logged in successfully",
            success : true,
            user
        })
    }
    catch(e){
        return res.json({
            message : "Internal Server Error",
            success : false
        })
    }
};

export {register, login};