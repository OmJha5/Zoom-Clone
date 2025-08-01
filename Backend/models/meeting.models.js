import { Schema } from "mongoose";
import mongoose from "mongoose";
import { User } from "./user.models.js";

const meetingSchema = new Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : User,
        required : true
    },

    meetingCode : {type : String, required : true},

} , {timestamps : true});

const Meeting = mongoose.model('Meeting', meetingSchema);
export { Meeting };