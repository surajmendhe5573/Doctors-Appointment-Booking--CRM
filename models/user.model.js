const mongoose = require("mongoose");

const userSchema= new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        requird: true
    },
    role: {
        type: String,
        enum: ['Doctor', 'Patient', 'Admin'],
        default: 'Patient'
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    }
}, {timestamps: true});

module.exports= mongoose.model('User', userSchema);