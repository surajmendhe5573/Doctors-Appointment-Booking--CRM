const mongoose= require('mongoose');

const appointmentSchema= new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: { 
        type: String,
        enum: ["Upcoming", "Done", "Canceled"],
        default: "Upcoming" 
    },
    transferredTo: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Doctor"
     },
}, {timestamps: true});

module.exports = mongoose.model("Appointment", appointmentSchema);
  