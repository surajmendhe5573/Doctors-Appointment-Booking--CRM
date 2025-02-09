const User= require('../models/user.model');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');  

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


const fetchUser= async(req, res)=>{
    try {
        const user = await User.findById(req.user.id); 

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({message: 'User fetched successfully', user});
        
    } catch (error) {
        res.status(500).json({message: 'Internaal server error'});
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

        userExist.refreshToken = null;

        await userExist.save();

        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        userExist.resetToken = resetToken;
        userExist.resetTokenExpiration = Date.now() + 3600000; // 1 hour

        await userExist.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,  
                pass: process.env.EMAIL_PASSWORD  
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Use the following token to reset your password: ${resetToken}\n\nThis token is valid for 1 hour.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            console.log('Password reset email sent:', info.response);
            res.status(200).json({ message: 'Password reset link sent to email' });
        });

    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        const user = await User.findOne({ resetToken });

        if (!user) {
            console.error('User not found with the provided reset token');
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (user.resetTokenExpiration < Date.now()) {
            console.error('Reset token has expired');
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetToken = undefined; 
        user.resetTokenExpiration = undefined; 
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports= {signUp, login, fetchAllUsers, editUsers, deleteUser, refreshAccessToken, logout, forgotPassword, resetPassword, fetchUser};