//In the resolvers, we call the sub-queries form the schema, the sub-queries are methods in form of a function, 'hello()' here is a sub-query in the RootQuery, which returns a text and a view, we call it here and we resolve it- define what it returns, essentially the string and int part
//Note the use of ':' and ','
/*
module.exports = {
    hello() {
        return {
            text: 'Hello World!',
            views: 12345
        }
    }

}*/


//Based on my Observation, async, await and Promises are called on tasks that might take a while to run, i.e task that won't run immediately, like saving to database, loooking for a user with an email, hashing a password, checking if password matches. In summary any action that's not immediate, we must use promises or call an async await on the callback function
const User =require('../models/user')
const Post = require('../models/post')
const bcrypt = require('bcryptjs');
const validator= require('validator')
const jwt = require('jsonwebtoken')

module.exports = {
    //createUser(args,req){
        //const email = args.userInput.email
        //or using destructuring}

    createUser: async function({ userInput}, req){
    //const email = userInput.email;
    const errors = []
    if (!validator.isEmail(userInput.email)){
        errors.push({message:'Email is invalid'})
    }
    if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password,{ min: 5})){
        errors.push({message: "Password too short!"})
    }
    //Throwing error if the error in the error list is greater than zero.

    if (errors.length >0){
        const error = new Error('Invalid input')
        error.data = errors;
        error.code = 422
        throw error;
    }
    const existinguser = await User.findOne({email: userInput.email});
    //or
    // return User.findOne(userinput.email).then().catch()
    if (existinguser){
        const error = new Error('User exists already')
        throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12)
    const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() }



    },
    login: async function({ email, password }) {
        const user = await User.findOne({email:email});
        if (!user){
            const error = new Error('User not Found')
            console.error = 401;
            throw error;

        }
        const isEqual = await bcrypt.compare(password,user.password);
        if (!isEqual){
            const error = new Error('Password is incorrect');
            error.code = 401;
            throw error 

        }
        const token =  jwt.sign({
            userId: user._id.toString(),
            email: user.email}, 'secret',{ expiresIn: '1h' }
            ) 
        return { token: token, userId: user._id.toString() };
        
      },

      createPost: async function({ postInput }, req){
          if (!req.isAuth){
              const error = new Error('Not authenticated!');
              error.code = 401;
              throw error;
          }
          const errors = [];
          if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({message: 'Title is invalid'})
          }

          if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({message: 'Title is invalid'})
          }
          if (errors.length >0){
            const error = new Error('Invalid input')
            error.data = errors;
            error.code = 422
            throw error;
        }
        const user = await User.findById(req.userId);
        if(!user){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;

        }
        const post = new Post({
            title : postInput.title,
            content: postInput.content,
            imageUrl :postInput.imageUrl,
            creator: user

        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save()
        //Add post to users post
        return {...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString(),updatedAt: createdPost.updatedAt.toISOString()
        };

      },
      posts: async function(args, req){
          
        if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }
        const totalPosts = await Post.find().countDocuments();
        
        const posts= await Post.find()
        .sort({ createdAt:-1 })
        .populate('creator');
        return{ posts:posts.map(p=>{
            return{...p._doc,_id:p._id.toString(), createdAt:p.createdAt.toISOString(), 
                updatedAt: p.updatedAt.toISOString() }
        }), totalPosts: totalPosts };
      }



};