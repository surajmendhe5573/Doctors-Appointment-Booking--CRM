const mongoose= require('mongoose');

const doctorSchema= new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId, ref: 'User', 
        required: true
    },
    specialities: {
        type: [String]
    },
    qualifications: {
        type: [String]
    },
    availability: {
        days: [String], // e.g., ["Monday", "Wednesday"]
      timeSlots: [String], // e.g., ["10:00-12:00", "14:00-16:00"]
    }
}, {timestamps: true});


  module.exports = mongoose.model("Doctor", doctorSchema);
  