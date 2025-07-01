import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        requied: true,
        unique: true,
        lowercase: true,
        index: true,
        trim: true
    },
    email:{
        type: String,
        requied: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname :{
        type: String,
        requied: true,
        index: true,
        trim: true
    },
    avatar:{
        type: String,//cloud url
        requied: true
    },
    coverImg: {
        type: String //cloud url
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        requied: [true,"Please enter password"]
    },
    refreshTokens:{
        type: String
    }
},{timestamps:true})

userSchema.pre("save", async function (){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.password(this.password,10)
    next()
})

userSchema.method.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.method.generateAccessToken =  function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            fullname : this.fullname,
            username : this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.method.generateRefreshToken =  function () {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = new mongoose.model("User",userSchema)