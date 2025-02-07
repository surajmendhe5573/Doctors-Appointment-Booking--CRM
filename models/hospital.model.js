const mongoose= require('mongoose');

const hospitalSchema= new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    departments: {
        type: [String]
    }
}, {timestamps: true});


module.exports= mongoose.model('Hospital', hospitalSchema);