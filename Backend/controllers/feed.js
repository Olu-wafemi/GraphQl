const {validationResult} = require('express-validator')
const fs = require('fs')
const path = require('path')
const  Post = require('../models/post');
const User = require('../models/user')
exports.getPosts = (req,res,next) =>{
    //Llogic for implementing Pagination
    const currentPage = req.query.page || 1 //If the current page is not defined assign the value as 1
    
    const perPage = 2;
    let totalItems;
    Post.find().countDocuments()//find the documents and count the number of documents present
    .then(count=>{
        totalItems = count;
        return Post.find()
        .skip((currentPage-1)* perPage)
        .limit(perPage)
        
       

    })
    .then(posts=>{
        res
        .status(200)
        .json({message: 'fetched Posts successfully', posts: posts, totalItems: totalItems})
    })
    .catch(err=>{
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
    //Find allPosts
   

 


}

exports.createPost = (req,res,next) =>{

    //errors is for handling errors
    const errors = validationResult(req);
    //If errors are not empty
    if(!errors.isEmpty()){
        const error = new Error('Validation failed')//For handling errors
        error.statusCode =422
        throw error//Throw error here autoamtically exits the req,res arrow function above and moves to the next error handling function in the middleware  in the express app which will be the middleware after the route middleware
    }
 
    if (!req.file) {
        const error = new Error('No image provided')
        error.statusCode = 422;
        throw error
    }
    const imageUrl = req.file.path
    const title = req.body.title
    const content = req.body.content
   
    let creator;

    //create post in db
    const post = new Post({
        title: title, 
            content: content, 
            imageUrl:imageUrl,
            creator: req.userId,    //Get userId from the isAuth middleware that was stored when sending the token
           
    })
    post.save()
    .then(result=>{
       return  User.findById(req.userId) //After creating the post, then the userId of such post is used to find the locate the user in the database
    }).then(user=>{
        creator = user
        console.log(user)
        user.posts.push(post) //The user model has a posts attribute, the present post is then added to the User post array
        return user.save();
        

    
        
                
                
        

    }).then(result=>{
        console.log(creator)
        console.log(post)
        res.status(201).json({
            message: 'Post created',
            post: post, 
            creator:{ _id: creator._id, name: creator.name }
            // Here we're sending the details of the creator back to the front end, after retrieving thier details from the database through the userId
        })
    })
    .catch(err=>{
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })

    


}


exports.getPost = (req,res,next) =>{
    const postId = req.params.postId

    Post.findById(postId)
    .then(post =>{
        if(!post){

            const error = new Error('Could not find post.')
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Post fetched', post:post});
    })
    .catch(err=>{
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}


//put request have a request body, but can also have parsmeters in the url
exports.updatePost = (req,res,next)=>{
    const postId = req.params.postId
    const errors = validationResult(req);
    //If errors are not empty
    if(!errors.isEmpty()){
        const error = new Error('Validation failed')//For handling errors
        error.statusCode =422
        throw error//Throw error here autoamtically exits the req,res arrow function above and moves to the next error handling function in the middleware  in the express app which will be the middleware after the route middleware
    }
 
   

    const title= req.body.title
    const content = req.body.content
    let imageUrl =  req.body.image
    if(req.file){
        imageUrl=req.file.path;
    }
    if (!imageUrl) {
        const error = new Error("No file Picked")
        error.statusCode = 422;
        throw error

    }

    Post.findById(postId)
    .then(post=>{

        //Check if a post exist
        if(!post){
            const error = new Error('Could not find post.')
            error.statusCode = 404;
            throw error;

        }
        //Check if the Creator id of a post is equal to the id of the currently logged in user
        //post.creator.toString first converts the userId which is in form of an object back to string, so the if statement can compare it
        if (post.creator.toString()!== req.userId){
            const error = new Error('Not Authorized!');
            error.statusCode  =403;
            throw error



        }
        if(imageUrl !=post.imageUrl){
            clearImage(post.imageUrl);
        }

        post.title = title
        post.imageUrl = imageUrl
        post.content = content
        return post.save()
    })
    .then(result=>{
        res.status(200).json({message: 'Post Updated!', post: result})
    })
    .catch(err=>{
        if (!err.statusCode){
            err.statusCode = 500
        }

        next(err)
    })
}

exports.deletePost = (req,res,next)=>{

    const postId = req.params.postId
    Post.findById(postId)
    .then(post=>{
        //Check if post of with such postId exists
        if(!post){
            const error = new Error('Could not find post.')
            error.statusCode = 404;
            throw error;

        }
        //Check logged in user
        if(post.creator.toString()!== req.userId){
            const error = new Error("You can't delete this post")
            error.statusCode = 422
            throw  error
        }

        
        clearImage(post.imageUrl)
        //Delete Post by Id
        return Post.findByIdAndRemove(postId)
    })
    .then(result=>{
        //After deleting a Post, we should also delete the user relationship with such post in the db, therefore after deleting
        return User.findById(req.userId)
    }).then(user=>{
        //Here after retrieving a user by its Id, we want to delete the specific post we deleted earlier from the collection of a user, this is done by removing the id of the post we deleted, from the collection of such user, using the  pull method
        user.posts.pull(postId)
        return user.save()
        
    })
    .then(result=>{
        res.status(200).json({message: 'Post Deleted Successfully'})

    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode= 500

        }
        next(err);

    })
}
exports.getStatus = (req,res,next) =>{
    User.findById(req.userId)
    .then(user=>{
        if(!user){
            const error = new Error('User not found')
            error.statusCode = 404
            throw error;

        }
        
        res.status(200).json({status: user.status })
    })
    
    .catch(err=>{
        
            if (!err.statusCode){
                err.statusCode = 500
            }
    
            
        
            next(err)
        
    })
   


}
exports.postStatus = (req,res,next) =>{
    const status = req.body.status
    
    User.findById(req.userId)
    .then(user=>{
        if (!user){
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }
        user.status =status
        return user.save()
        


    })
    .then(result=>{
        res.status(200).json({message: 'Status Updated Successfully'})
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode = 300
        }
    
        next(err)
    })


}
const clearImage = filePath =>{
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err=> console.log(err))
}

