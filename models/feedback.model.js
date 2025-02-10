const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Doctor", 
    required: false // Optional, as feedback can be for a hospital
  },
  hospital: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Hospital", 
    required: false // Optional, as feedback can be for a doctor
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 // Rating scale from 1 to 5
  },
  comment: { 
    type: String, 
    required: false // Optional, as some feedback might just be a rating
  },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);