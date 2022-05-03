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
const { clearImage } = require('../util/file')
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
      posts: async function({page}, req){
        //Check if a user is authenticated
        if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }
        //After a user is authenticated proceeed to run this other codes
        //If page is not defined set it to 1 instead
        if (!page){
            page =1;
        }

        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        
        const posts= await Post.find()
        .sort({ createdAt:-1 })
        .skip((page -1)* perPage) //Skip and limit are used for pagination, to set a specific items to be displayed per page.
        
        //Skip in this case will skip the items already displayed on the order pages, we're displayed two items per page in this case, so for page 2, (2-1 * 2) = 2, so skip the first two items already displayed in the first page.
        .limit(perPage) 
        .populate('creator');
        return{ posts:posts.map(p=>{
            return{...p._doc,_id:p._id.toString(), createdAt:p.createdAt.toISOString(), 
                updatedAt: p.updatedAt.toISOString() }
        }), totalPosts: totalPosts };
      },

      //Getting requests with destructuring
      post: async function({ id }, req){
          //VCheck for authentication

       if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }
        
        //Find by Id and populate with the details of the creator and not the id alone
        const post = await Post.findById(id).populate('creator');
        if (!post){
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
           
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString() 
        }




      },

      updatePost: async function({ id, postInput}, req){
        if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator')
        if (!post){
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        //Check if user who created post is the one trying to edit it
        if (post.creator_id.toString() !== req.userId.toString()){
            const error = new Error('Not Authorized!')
            error.code = 403;
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
        post.title = postInput.title;
        post.content = postInput.content
        if (postInput.imageUrl != 'undefined'){
            post.imageUrl = post.imageUrl;

        }
        const updatedPost = await post.save();
        return { ...updatedPost._doc, _id: updatedPost._id.toString(), createdAt: updatedPost.createdAt.toISOString(), updatedAt: updatedAt. updatePost.updatedAt.toISOString()}



      },
      deletePost: async function({ id }, req){
        if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id)
        if (!post){
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        //Check if user who created post is the one trying to edit it
        //Notice the use of creator and not creator_id in thhis case, because when searching for post in the database, we didn't populate it with creator in this case
        if (post.creator.toString() !== req.userId.toString()){
            const error = new Error('Not Authorized!')
            error.code = 403;
            throw error;


        }
        //Delete the image
        clearImage(post.imageUrl);
        //Delete the post
        await Post.findByIdAndRemove(id);
        //Find the post in the user
        const user = await User.findById(req.userId);
        //Delete the specific post from the posts of the user
        user.posts.pull(id);
        await user.save()
        return true;




      },
      user: async function(args, req){
        if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user){
            const error = new Error('No User found!')
            error.code = 404;
            throw error;


        }
        return {...user.doc_, _id: user._id.toString() }
      },
    updateStatus: async function({status}, req){
        /*if(!req.isAuth){
            const error = new Error('Invalid user')
            error.code = 401;
            throw error;
        }*/
        const user = await User.findById(req.userId);
        
        if (!user){
            const error = new Error('No User found!')
            error.code = 404;
            throw error;


        }
        user.status = status
        await user.save()
        return { ...user._doc, _id: user._id.toString() }


    }
    

};