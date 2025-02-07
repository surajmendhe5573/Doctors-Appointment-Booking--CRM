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

module.exports = { addDoctor };
