const jwt= require('jsonwebtoken');
require('dotenv').config();

const authenticate= (req, res, next)=>{
    const token= req.header('Authorization')?.replace('Bearer ', '');

    if(!token){
        return res.status(401).json({message: 'Access denied. No token provided'});
    }

    try {
        const decoded= jwt.verify(token, process.env.JWT_SECRET);
        req.user= decoded;

        next();
        
    } catch (error) {
       res.status(401).json({message: 'Invalid or Expired token'}); 
    }
};

const authorizeAdmin= (req, res, next)=>{
    if(req.user.role !== 'Admin'){
        return res.status(403).json({message: 'Access denied. Admins only'});
    }
    next();
}


module.exports= {authenticate, authorizeAdmin};