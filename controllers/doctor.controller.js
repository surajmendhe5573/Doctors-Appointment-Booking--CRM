const Doctor = require('../models/doctor.model');
const User = require('../models/user.model'); 

const addDoctor = async (req, res) => {
  try {
    const { user, specialities, qualifications, availability } = req.body;

    const existingUser = await User.findById(user);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (existingUser.role !== 'Doctor') {
        return res.status(400).json({ message: 'The user must be a doctor to add as a doctor.' });
      }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can add doctors.' });
    }

    const newDoctor = new Doctor({
      user,
      specialities,
      qualifications,
      availability
    });

    await newDoctor.save();
    res.status(201).json({message: 'Doctor added successfully', doctor: newDoctor });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDoctor = async (req, res) => {
    try {
      const { user, specialities, qualifications, availability } = req.body;
      const { doctorId } = req.params; 
  
      if (req.user.role !== 'Admin') {
        if (req.user.id !== user) {
          return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
        }
      }
  
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
  
      // Check if the associated user is a doctor
      const doctorUser = await User.findById(user);
      if (!doctorUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (doctorUser.role !== 'Doctor') {
        return res.status(400).json({ message: 'The associated user must be a doctor.' });
      }
  
      doctor.specialities = specialities || doctor.specialities;
      doctor.qualifications = qualifications || doctor.qualifications;
      doctor.availability = availability || doctor.availability;
  
      if (user) {
        const updatedUser = await User.findByIdAndUpdate(user, { $set: req.body.userDetails }, { new: true });
        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }
      }
  
      await doctor.save();
      res.status(200).json({
        message: 'Doctor information updated successfully',
        doctor
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  
module.exports = { addDoctor, updateDoctor };
