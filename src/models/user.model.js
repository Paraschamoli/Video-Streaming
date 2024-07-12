import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
username:{
    type:String,
    required:true,
    unique:true,
    lowecase:true,
    trim:true,
    index:true // to make a field searchable in optimise way
},
email:{
    type:String,
    required:true,
    unique:true,
    lowecase:true,
    trim:true
},
fullname:{
    type:String,
    required:true,
    trim:true,
    index:true
},
avatar:{
    type:String , // cloudinary url used here
    required:true
},
coverImage:{
    type:String
},
watchHistory:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }
],
password:{
    type:String,
    required:[true,'password is required']
},
refershToken:{
    type:String
}

},{timestamps:true})

export const User=mongoose.model("User",userSchema)