const User= require('../models/user.model');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
require('dotenv').config();

const signUp= async(req, res)=>{
    try {
        const {name, email, password, role, phone, address}= req.body;
        
        if(!name || !email || !password || !role || !phone || !address){
            return res.status(400).json({message: 'All fields are required'});
        }

        const userExist= await User.findOne({email});
        if(userExist){
            return res.status(409).json({messagee: 'User already exist'});
        }

        const hashedPassword= await bcrypt.hash(password, 10);
        
        const newUser= new User({
            name, 
            email,
            password: hashedPassword, 
            role,
            phone,
            address
        });

        await newUser.save();
        res.status(201).json({message: 'User created successfully', user:newUser});
        
    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
};

const login= async(req, res)=>{
    try {
        const {email, password}= req.body;

        if(!email || !password){
            return res.status(400).json({message: 'Email and Password are required'});
        }

        const userExist= await User.findOne({email});
        if(!userExist){
            return res.status(401).json({message: 'Inavalid credentials'});
        }

        const isMatch= await bcrypt.compare(password, userExist.password);
        if(!isMatch){
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const accessToken= jwt.sign({id: userExist._id, role: userExist.role}, process.env.JWT_SECRET, {expiresIn: '1h'});
        const refreshToken = jwt.sign({ id: userExist._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        userExist.refreshToken = refreshToken;

        res.status(200).json({message: 'User logged in successfully', accessToken, refreshToken});
        
    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
};

const fetchAllUsers= async(req, res)=>{
    try {

        const users= await User.find({}, '-password');
        
        if(users.length==0){
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json({message: 'Users fetched successfully', users});
        
    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
};

const editUsers= async(req, res)=>{
    try {
        const {id}= req.params;

        if(req.user.id != id && req.user.role != 'Admin'){
            return res.status(403).json({message: 'Access denied. You can only edit your own details, or Admin can edit any user.'});
        }

        const {name, email, password, role, phone, address}= req.body;

        const updates= {};

        if(name) updates.name= name;
        if(email){
            const userExist= await User.findOne({email});
            if(userExist && userExist._id != id){
                return res.status(409).json({message: 'This email already taken by another user'});
            }
            updates.email= email;
        };

        if(password){
            const hashedPassword= await bcrypt.hash(password, 10);
            updates.password= hashedPassword;
        };

        if(role) updates.role= role;
        if(phone) updates.phone= phone;
        if(address) updates.address= address;

        const updateUser= await User.findByIdAndUpdate(id, updates, {new:true, runValidators: true});
        if(!updateUser){
            return res.status(404).json({message: 'user not found'});
        }

        res.status(200).json({message: 'User updated successfully', user:updateUser});
        
    } catch (error) {
       res.status(500).json({message: 'Internal server error'}); 
    }
};

const deleteUser= async(req, res)=>{
    try {
        const {id}= req.params;

        if(req.user.id != id && req.user.role != 'Admin'){
            return res.status(403).json({message: 'Access denied. You can only delete your own account or admin can delete.'});
        }

        const deleteUser= await User.findByIdAndDelete(id);
        if(!deleteUser){
            return res.status(404).json({message: 'User not found'});
        }
        
        res.status(200).json({message: 'User deleted successfully'});
    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Session expired, please log in again' });
            }

            const userExist = await User.findById(decoded.id);
            if (!userExist || userExist.refreshToken !== process.env.refreshToken) {
                return res.status(403).json({ message: 'Session expired, please log in again' });
            }

            const accessToken = jwt.sign({ id: userExist._id, role: userExist.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({ accessToken });
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    try {
        const { id } = req.user; 

        const userExist = await User.findById(id);
        if (!userExist) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove the refresh token
        userExist.refreshToken = null;
        
        await userExist.save();

        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports= {signUp, login, fetchAllUsers, editUsers, deleteUser, refreshAccessToken, logout};