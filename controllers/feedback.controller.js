const Feedback = require("../models/feedback.model");
const User = require("../models/user.model");
const Doctor = require("../models/doctor.model");
const Hospital = require("../models/hospital.model");

const addFeedback = async (req, res) => {
  try {
    const { patient, doctor, hospital, rating, comment } = req.body;

    if (!doctor && !hospital) {
      return res.status(400).json({ message: "Feedback must be associated with a doctor or a hospital." });
    }

    const patientExists = await User.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (doctor) {
      const doctorExists = await Doctor.findById(doctor);
      if (!doctorExists) {
        return res.status(404).json({ message: "Doctor not found." });
      }
    }

    if (hospital) {
      const hospitalExists = await Hospital.findById(hospital);
      if (!hospitalExists) {
        return res.status(404).json({ message: "Hospital not found." });
      }
    }

    const feedback = new Feedback({
      patient,
      doctor,
      hospital,
      rating,
      comment,
    });

   
    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully!", feedback });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ message: "Server error while adding feedback." });
  }
};

const getFeedbackForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const feedback = await Feedback.find({ doctor: doctorId }).populate("patient", "name email");

    res.status(200).json({ feedback });
  } catch (error) {
    console.error("Error retrieving feedback for doctor:", error);
    res.status(500).json({ message: "Server error while retrieving feedback." });
  }
};

const getFeedbackForHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const hospitalExists = await Hospital.findById(hospitalId);
    if (!hospitalExists) {
      return res.status(404).json({ message: "Hospital not found." });
    }
    const feedback = await Feedback.find({ hospital: hospitalId }).populate("patient", "name email");

    res.status(200).json({ feedback });
  } catch (error) {
    console.error("Error retrieving feedback for hospital:", error);
    res.status(500).json({ message: "Server error while retrieving feedback." });
  }
};

module.exports = {
  addFeedback,
  getFeedbackForDoctor,
  getFeedbackForHospital,
};