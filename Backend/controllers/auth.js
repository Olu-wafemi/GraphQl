const User =  require('../models/user')
const  body = require('express-validator')
const bcrypt = require('bcryptjs')
const { validationResult }= require('express-validator')
const jwt = require('jsonwebtoken') 
exports.signup = (req,res,next) =>{
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        const error = new Error('Validation failed')
        error.statuscode = 422;
        error.data = errors.array()
       throw error;

    }
    const email = req.body.email
    const name =req.body.name;
    const password = req.body.password
    //Hashing the password
    bcrypt.hash(password,12)
    .then(hashedPass=>{
        const user = new User({ //create a new user
            email:email,
            password: hashedPass,
            name:name
        })
        return user.save()
    })
    .then(result=>{
        res.status(201).json({message:'User created', userId: result._id})
    })
    .catch(err=>{
        if(!err.statuscode){//Check for the existence of a statusCode, if none exists return a 500 errror
            err.statuscode = 500
        }
        next(err);
    })

    
}

exports.login  =(req,res,next) =>{
    const email = req.body.email
    const password = req.body.password
    let loadedUser;
    User.findOne({email:email})
    .then(user=>{
        //Invalid user
        if(!user){
           const error = new Error('A user with this email could not be found') 
           error.statuscode = 401;
           throw error;
        }
        loadedUser =user
        return bcrypt.compare(password,user.password)
    })
    .then(isEqual=>{
        if(!isEqual){
            const error = new Error('wrong password!')
            error.statuscode = 401;
            throw error;
        }
        //using jwt to create a token after checking if the password entered by the user is correct 


        const token = jwt.sign({email:loadedUser.email,
                 userId: loadedUser._id.toString()}, 'secret', { expiresIn: '1h' })
                 res.status(200).json({token: token, userId:loadedUser._id.toString() })// send the token and the user id back to the frontend


    })
    .catch(err=>{
        //This could be database error or network error
        if(!err.statuscode){
            err.statuscode= 500
        }
        next(err)
    })
}