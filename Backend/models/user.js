//User Model
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Post = require('../models/post')
const userSchema = new Schema({
    email:{
        type: String, 
        required: true
    },
    password:{
        type:String,
        required: true
    },
    name:{
        type: String,
        required : true
    },
    status: {
        type:String,
        default: 'I am new here'
    },
    //The ref part references  the post created by a user
    posts:[{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }]

})


module.exports = mongoose.model('User', userSchema)