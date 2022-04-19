const jwt = require('jsonwebtoken')

module.exports = (req,res,next) =>{
    const authHeader = req.get("Authorization")
    //console.log(authHeader )
    if(!authHeader){
        req.isAuth = false
        //return next here means continue with the next middleware and the codes after the if statement
        return next()
    }
    const token = authHeader.split(' ')[1];
    let decodedToken
    try{
        decodedToken  = jwt.verify(token,'secret')

    } catch (err){
       req.isAuth = false;
       return next()
    } 
    //if the token was not verified
    if (!decodedToken) {
        req.isAuth =false
        return next();
    }
    req.userId = decodedToken.userId;
    req.isAuth = true
    next()
}