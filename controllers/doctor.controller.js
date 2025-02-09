const Doctor = require('../models/doctor.model');
const User = require('../models/user.model'); 
const Hospital= require('../models/hospital.model');

const addDoctor = async (req, res) => {
  try {
    const { user, specialities, qualifications, availability, hospital } = req.body;

    const existingUser = await User.findById(user);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (existingUser.role !== 'Doctor') {
      return res.status(400).json({ message: 'The user must be a doctor to add as a doctor.' });
    }

    const existingHospital = await Hospital.findById(hospital);
    if (!existingHospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can add doctors.' });
    }

    const newDoctor = new Doctor({
      user,
      specialities,
      qualifications,
      availability,
      hospital,
    });

    await newDoctor.save();

    const populatedDoctor = await Doctor.findById(newDoctor._id)
      .populate('user', 'name') 
      .populate('hospital', 'name'); 

    res.status(201).json({
      message: 'Doctor added successfully',
      doctor: {
        ...populatedDoctor.toObject(), 
        doctorName: populatedDoctor.user.name, 
        hospitalName: populatedDoctor.hospital.name, 
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { user, specialities, qualifications, availability, hospital } = req.body;
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

    const doctorUser = await User.findById(user);
    if (!doctorUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (doctorUser.role !== 'Doctor') {
      return res.status(400).json({ message: 'The associated user must be a doctor.' });
    }

    if (hospital) {
      const existingHospital = await Hospital.findById(hospital);
      if (!existingHospital) {
        return res.status(404).json({ message: 'Hospital not found' });
      }
      doctor.hospital = hospital; 
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

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('user', 'name')
      .populate('hospital', 'name'); 

    
    res.status(200).json({
      message: 'Doctor information updated successfully',
      doctor: {
        ...populatedDoctor.toObject(), 
        doctorName: populatedDoctor.user.name, 
        hospitalName: populatedDoctor.hospital.name, 
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate({
        path: 'user',
        select: 'name email role phone address', 
        match: { role: 'Doctor' } 
      })
      .populate({
        path: 'hospital',
        select: 'name' 
      })
      .exec();

    const filteredDoctors = doctors.filter(doctor => doctor.user);

    if (filteredDoctors.length === 0) {
      return res.status(404).json({ message: 'No doctors found' });
    }

    res.status(200).json({
      message: 'Doctors fetched successfully',
      doctors: filteredDoctors.map(doctor => ({
        ...doctor.toObject(),
        doctorName: doctor.user.name, 
        hospitalName: doctor.hospital?.name 
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


  const deleteDoctors= async(req, res)=>{
        try {
            const {doctorId}= req.params;

            if (req.user.id !== doctorId && req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Access denied. Only admins can delete doctors or only doctors delete their own profile.' });
              }
          

            const deleteDoctors= await Doctor.findByIdAndDelete(doctorId);
            if(!deleteDoctors){
                return res.status(404).json({message: 'Doctor not found'});
            }

            res.status(200).json({message: 'Doctor deleted successfully'});
            
        } catch (error) {
            console.log(error);
            
            res.status(500).json({message: 'Internal server error'});
        }
  }
  
  // const searchDoctors = async (req, res) => {
  //   try {
  //     const { name, specialities, availability } = req.query;
  //     console.log('Query Parameters:', req.query);
  
  //     const searchQuery = {};
  
  //     if (name) {
  //       const users = await User.find({ name: { $regex: name, $options: 'i' }, role: 'Doctor' });
  //       if (users.length === 0) {
  //         return res.status(404).json({ message: 'No doctors found based on the search criteria' });
  //       }
        
  //       const userIds = users.map(user => user._id);
  //       searchQuery.user = { $in: userIds };
  //     }
  
  //     if (specialities) {
  //       searchQuery.specialities = { $in: specialities.split(',') };
  //     }
  
  //     if (availability) {
  //       const availabilityCriteria = availability.split(',');
  //       searchQuery['availability.days'] = { $in: availabilityCriteria };
  //     }
  
  //     console.log('Search Query:', searchQuery); 
  
  //     const doctors = await Doctor.find(searchQuery)
  //       .populate({
  //         path: 'user',
  //         select: 'name email role phone address',
  //       })
  //       .populate({
  //         path: 'hospital',
  //         select: 'name',
  //       })
  //       .exec();
  
  //     console.log('Doctors Found:', doctors); 
  
  //     if (doctors.length === 0) {
  //       return res.status(404).json({ message: 'No doctors found based on the search criteria' });
  //     }
  
  //     res.status(200).json({
  //       message: 'Doctors fetched successfully',
  //       doctors: doctors.map(doctor => ({
  //         ...doctor.toObject(),
  //         doctorName: doctor.user.name,
  //         hospitalName: doctor.hospital?.name,
  //       })),
  //     });
  //   } catch (error) {
  //     console.log('Error:', error);
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // };

  const searchDoctors = async (req, res) => {
    try {
      const { name, specialities, availability } = req.query;
  
      const searchQuery = {};
  
      if (name) {
        const users = await User.find({ name: { $regex: name, $options: 'i' }, role: 'Doctor' });
        if (users.length === 0) {
          return res.status(404).json({ message: 'No doctors found based on the search criteria' });
        }
  
        const userIds = users.map(user => user._id);
        searchQuery.user = { $in: userIds };
      }
  
      if (specialities) {
        searchQuery.specialities = { $all: specialities.split(',') };
      }
  
      if (availability) {
        const availabilityCriteria = availability.split(',');
        searchQuery['availability.days'] = { $in: availabilityCriteria };
      }
  
      console.log('Search Query:', searchQuery); 

      const doctors = await Doctor.find(searchQuery)
        .populate({
          path: 'user',
          select: 'name email role phone address',
        })
        .populate({
          path: 'hospital',
          select: 'name',
        })
        .exec();
  
      console.log('Doctors Found:', doctors); 
  
      if (doctors.length === 0) {
        return res.status(404).json({ message: 'No doctors found based on the search criteria' });
      }
  
      res.status(200).json({
        message: 'Doctors fetched successfully',
        doctors: doctors.map(doctor => ({
          ...doctor.toObject(),
          doctorName: doctor.user.name,
          hospitalName: doctor.hospital?.name,
        })),
      });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  


module.exports = { addDoctor, updateDoctor, fetchAllDoctors, deleteDoctors, searchDoctors };
