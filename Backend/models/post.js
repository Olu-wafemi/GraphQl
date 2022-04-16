const { default: mongoose } = require('mongoose');
const moongoose = require('mongoose');
const Schema = mongoose.Schema
const User = require('../models/user')
const postSchema = new Schema({
    title:{
        type : String,
        required: true
    },
    imageUrl:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true
    },
    //This part is used to set the user that creates a post,

    creator:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true

    },
    

},{timestamps: true})

//Cn't export the schema directly
module.exports = mongoose.model('Post', postSchema)