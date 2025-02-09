const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const client= require('../utils/redisClient');

const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, date, time } = req.body;

        if (req.user.role !== 'Patient') {
            return res.status(403).json({ message: 'Access denied. Only Patient can create appointments.' });
        }

        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'Patient') {
            return res.status(400).json({ message: 'Invalid patient ID or the user is not a patient.' });
        }

        const doctor = await Doctor.findById(doctorId).populate('hospital', 'name');
        if (!doctor) {
            return res.status(400).json({ message: 'Invalid doctor ID.' });
        }

        // Extract the day name from the date
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

        // Check if the doctor is available on the given date and time
        const isDoctorAvailable = doctor.availability.days.includes(day) &&
            doctor.availability.timeSlots.includes(time);

        if (!isDoctorAvailable) {
            return res.status(400).json({ message: 'Doctor is not available at the selected date and time.' });
        }

        // Check for overlapping appointments for the doctor at the same date and time
        const conflictingAppointment = await Appointment.findOne({
            doctor: doctorId,
            date,
            time,
            status: { $in: ['Upcoming'] },
        });

        if (conflictingAppointment) {
            return res.status(400).json({ message: 'The doctor is already booked for this time slot.' });
        }

        const appointment = new Appointment({
            patient: patientId,
            doctor: doctorId,
            date,
            day, // Store the day name
            time,
            status: 'Upcoming',
        });

        await appointment.save();

        // Populate patient name and doctor name
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('patient', 'name')
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            })
            .populate({
                path: 'doctor',
                populate: {
                    path: 'hospital',
                    select: 'name'
                }
            });

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment: {
                _id: populatedAppointment._id,
                patientName: populatedAppointment.patient?.name,
                doctorName: populatedAppointment.doctor?.user?.name,
                hospitalName: populatedAppointment.doctor?.hospital?.name,
                date: populatedAppointment.date,
                time: populatedAppointment.time,
                status: populatedAppointment.status,
                createdAt: populatedAppointment.createdAt,
                updatedAt: populatedAppointment.updatedAt,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { doctor, date, time, status } = req.body; 

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (req.user.role !== 'Admin' && req.user.id !== String(appointment.patient)) {
            return res.status(403).json({ message: 'Access denied. You can only update your own appointments.' });
        }

        if (doctor) {
            const existingDoctor = await Doctor.findById(doctor).populate('hospital', 'name');
            if (!existingDoctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            const isDoctorAvailable = existingDoctor.availability.days.includes(
                new Date(date || appointment.date).toLocaleDateString('en-US', { weekday: 'long' })
            ) && existingDoctor.availability.timeSlots.includes(time || appointment.time); 

            if (!isDoctorAvailable) {
                return res.status(400).json({ message: 'Doctor is not available at the selected date and time.' });
            }

            const conflictingAppointment = await Appointment.findOne({
                doctor,
                date: date || appointment.date,
                time: time || appointment.time,
                status: { $in: ['Scheduled', 'Upcoming'] },
            });

            if (conflictingAppointment) {
                return res.status(400).json({ message: 'The doctor is already booked for this time slot.' });
            }

            appointment.doctor = doctor;
        }

        if (date || time) { 
            const existingDoctor = await Doctor.findById(appointment.doctor);

            const isDoctorAvailable = existingDoctor.availability.days.includes(
                new Date(date || appointment.date).toLocaleDateString('en-US', { weekday: 'long' })
            ) && existingDoctor.availability.timeSlots.includes(time || appointment.time); 

            if (!isDoctorAvailable) {
                return res.status(400).json({ message: 'Doctor is not available at the selected date and time.' });
            }

            const conflictingAppointment = await Appointment.findOne({
                doctor: appointment.doctor,
                date: date || appointment.date,
                time: time || appointment.time, 
                status: { $in: ['Scheduled', 'Upcoming'] },
                _id: { $ne: appointmentId },
            });

            if (conflictingAppointment) {
                return res.status(400).json({ message: 'The doctor is already booked for this time slot.' });
            }

            appointment.date = date || appointment.date;
            appointment.time = time || appointment.time; 
        }

        if (status) {
            appointment.status = status;
        }

        await appointment.save();

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('patient', 'name')
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name',
                },
            })
            .populate({
                path: 'doctor',
                populate: {
                    path: 'hospital',
                    select: 'name',
                },
            });

        res.status(200).json({
            message: 'Appointment updated successfully',
            appointment: {
                _id: populatedAppointment._id,
                patientName: populatedAppointment.patient?.name,
                doctorName: populatedAppointment.doctor?.user?.name,
                hospitalName: populatedAppointment.doctor?.hospital?.name,
                date: populatedAppointment.date,
                time: populatedAppointment.time, 
                status: populatedAppointment.status,
                createdAt: populatedAppointment.createdAt,
                updatedAt: populatedAppointment.updatedAt,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
  
  const cancelAppointment = async (req, res) => {
    try {
      const { appointmentId } = req.params;
  
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      if (!req.user || !appointment.patient) {
        return res.status(400).json({ message: 'Invalid user or appointment data.' });
      }
  
      if (req.user.role !== 'Admin' && req.user.id.toString() !== appointment.patient.toString()) {
        return res.status(403).json({ message: 'You are not authorized to cancel this appointment.' });
      }
  
      appointment.status = 'Canceled';
      await appointment.save();
  
      res.status(200).json({ message: 'Appointment canceled successfully', appointment });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

//   const retrieveAppointments = async (req, res) => {
//     try {
//       const { role, id: userId } = req.user;
//       const { doctorId, patientId, date, status } = req.query;
  
//       const query = {};
  
//       if (role === 'Patient') {
//         query.patient = userId; 
//       } else if (role === 'Doctor') {
//         query.doctor = userId; 
//       } else if (role === 'Admin') {
//         if (doctorId) query.doctor = doctorId;
//         if (patientId) query.patient = patientId;
//       } else {
//         return res.status(403).json({ message: 'Access denied.' });
//       }
  
     
//       if (date) query.date = date; 
//       if (status) query.status = status; 
  
//       const appointments = await Appointment.find(query)
//         .populate('patient', 'name email') 
//         .populate({
//           path: 'doctor',
//           populate: [
//             { path: 'user', select: 'name email' },
//             { path: 'hospital', select: 'name' },
//           ],
//         })
//         .sort({ date: 1, time: 1 }); 
  
//       res.status(200).json({ message: 'Appointments retrieved successfully', appointments });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   }; 

const retrieveAppointments = async (req, res) => {
    try {
      const { role, id: userId } = req.user;
      const { doctorId, patientId, date, status } = req.query;
  
      const query = {};
  
      // Constructing the query based on user role
      if (role === 'Patient') {
        query.patient = userId;
      } else if (role === 'Doctor') {
        query.doctor = userId;
      } else if (role === 'Admin') {
        if (doctorId) query.doctor = doctorId;
        if (patientId) query.patient = patientId;
      } else {
        return res.status(403).json({ message: 'Access denied.' });
      }
  
      if (date) query.date = date;
      if (status) query.status = status;
  
      // Create a unique cache key based on query and role
      const cacheKey = `appointments_${role}_${userId || ''}_${doctorId || ''}_${patientId || ''}_${date || ''}_${status || ''}`;
  
      // Check cache
      const cachedAppointments = await client.get(cacheKey);
      if (cachedAppointments) {
        return res.status(200).json({
          message: 'Appointments retrieved successfully (cached)',
          appointments: JSON.parse(cachedAppointments),
        });
      }
  
      // Fetch appointments from the database if not cached
      const appointments = await Appointment.find(query)
        .populate('patient', 'name email')
        .populate({
          path: 'doctor',
          populate: [
            { path: 'user', select: 'name email' },
            { path: 'hospital', select: 'name' },
          ],
        })
        .sort({ date: 1, time: 1 });
  
      // Cache the fetched appointments with an expiry time
      await client.set(cacheKey, JSON.stringify(appointments), { EX: 3600 });
  
      res.status(200).json({ message: 'Appointments retrieved successfully', appointments });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

  const retrieveCancelledAppointments = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Only Admin can retrieve canceled appointments.' });
        }

        const cancelledAppointments = await Appointment.find({ status: 'Canceled' })
            .populate('patient', 'name')  
            .populate('doctor', 'name')  
            .populate('doctor.hospital', 'name'); 

        if (cancelledAppointments.length === 0) {
            return res.status(404).json({ message: 'No canceled appointments found.' });
        }

        res.status(200).json({
            message: 'Cancelled appointments retrieved successfully.',
            cancelledAppointments: cancelledAppointments.map((appointment) => ({
                _id: appointment._id,
                patientName: appointment.patient?.name,
                doctorName: appointment.doctor?.name,
                hospitalName: appointment.doctor?.hospital?.name,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}; 

const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        
        if (!["Upcoming", "Done", "Canceled"].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (req.user.role === 'Admin') {
            appointment.status = status;
        } else if (req.user.role === 'Doctor') {
            if (String(appointment.doctor) !== String(req.user.id)) {
                return res.status(403).json({ message: 'You can only update appointments for your own patients' });
            }
            appointment.status = status;
        } else if (req.user.role === 'Patient') {
            if (String(appointment.patient) !== String(req.user.id)) {
                return res.status(403).json({ message: 'You can only update your own appointments' });
            }
            if (status !== "Canceled") {
                return res.status(400).json({ message: 'Patients can only cancel their appointments' });
            }
            appointment.status = status;
        }

        await appointment.save();

        res.status(200).json({
            message: 'Appointment status updated successfully',
            appointment: {
                _id: appointment._id,
                patientName: appointment.patient?.name,
                doctorName: appointment.doctor?.name,
                status: appointment.status,
                date: appointment.date,
                time: appointment.time,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUpcomingAppointments = async (req, res) => {
    try {
        const filter = { status: "Upcoming" };

        if (req.user.role === 'Admin') {
            filter.status = 'Upcoming';
        } else if (req.user.role === 'Doctor') {
            filter.doctor = req.user.id;
        } else if (req.user.role === 'Patient') {
            filter.patient = req.user.id;
        }

        const appointments = await Appointment.find(filter)
            .populate('patient', 'name email') 
            .populate('doctor', 'name email') 
            .sort({ date: 1, time: 1 }); 

        res.status(200).json({
            message: 'Upcoming appointments fetched successfully',
            appointments,
 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getDoneAppointments = async (req, res) => {
    try {
        const filter = { status: "Done" };
        if (req.user.role === 'Admin') {
            filter.status = 'Done';
        } else if (req.user.role === 'Doctor') {
            filter.doctor = req.user.id;
        } else if (req.user.role === 'Patient') {
            filter.patient = req.user.id;
        }

        const appointments = await Appointment.find(filter)
            .populate('patient', 'name email') 
            .populate('doctor', 'name email') 
            .sort({ date: 1, time: 1 });

        res.status(200).json({
            message: 'Done appointments fetched successfully',
            appointments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const mongoose = require('mongoose');
const transferAppointment = async (req, res) => {
    try {
        const { appointmentId, newDoctorId, date, time } = req.body;

        // Check if the user has the necessary role to transfer the appointment
        if (req.user.role !== 'Admin' && (req.user.role !== 'Doctor' || req.user.id !== req.body.doctorId)) {
            return res.status(403).json({ message: 'Access denied. Only Admin or the Doctor who owns the appointment can transfer it.' });
        }

        // Check if the appointmentId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID.' });
        }

        // Fetch the appointment to be transferred
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctor')
            .populate('patient');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Check if the logged-in doctor is the owner of the appointment (only applicable for doctors)
        if (req.user.role === 'Doctor' && appointment.doctor._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only transfer your own appointments.' });
        }

        // Fetch the new doctor details
        const newDoctor = await Doctor.findById(newDoctorId);
        if (!newDoctor) {
            return res.status(400).json({ message: 'Invalid new doctor ID.' });
        }

        // Check if the new doctor is available on the selected date and time
        const isDoctorAvailable = newDoctor.availability.days.includes(new Date(date).toLocaleDateString('en-US', { weekday: 'long' })) &&
            newDoctor.availability.timeSlots.includes(time);

        if (!isDoctorAvailable) {
            return res.status(400).json({ message: 'The new doctor is not available at the selected date and time.' });
        }

        // Check for any conflicting appointments for the new doctor at the same date and time
        const conflictingAppointment = await Appointment.findOne({
            doctor: newDoctorId,
            date,
            time,
            status: { $in: ['Upcoming'] }, // Only check upcoming appointments
        });

        if (conflictingAppointment) {
            return res.status(400).json({ message: 'The new doctor is already booked for this time slot.' });
        }

        // Transfer the appointment to the new doctor
        appointment.doctor = newDoctorId;
        appointment.status = 'Upcoming'; // Reset status as needed for your use case
        appointment.transferredTo = newDoctorId; // Track the transfer to a new doctor

        // Save the updated appointment
        await appointment.save();

        // Populate relevant information and return the response
        const updatedAppointment = await Appointment.findById(appointment._id)
            .populate('patient', 'name')
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            })
            .populate('doctor.hospital');

        // Extract doctor name safely using optional chaining
        const doctorName = updatedAppointment.doctor?.user?.name || 
                          updatedAppointment.doctor?.name ||  // Fallback if doctor name is directly on doctor
                          'Unknown Doctor';

        res.status(200).json({
            message: 'Appointment transferred successfully.',
            appointment: {
                _id: updatedAppointment._id,
                patientName: updatedAppointment.patient?.name,
                doctorName: doctorName,  // Add the extracted doctor name
                hospitalName: updatedAppointment.doctor?.hospital?.name,
                date: updatedAppointment.date,
                time: updatedAppointment.time,
                status: updatedAppointment.status,
                createdAt: updatedAppointment.createdAt,
                updatedAt: updatedAppointment.updatedAt,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getTransferredAppointments = async (req, res) => {
    try {
        
        const appointments = await Appointment.find({ transferredTo: { $ne: null } })
            .populate('patient', 'name')
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            })
            .populate('doctor.hospital')
            .select('patient doctor date time status transferredTo createdAt updatedAt');

        
        if (appointments.length === 0) {
            return res.status(404).json({ message: 'No transferred appointments found.' });
        }

        res.status(200).json({
            message: 'Transferred appointments fetched successfully.',
            appointments: appointments.map(appointment => ({
                _id: appointment._id,
                patientName: appointment.patient?.name,
                doctorName: appointment.doctor?.user?.name || appointment.doctor?.name,
                hospitalName: appointment.doctor?.hospital?.name,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status,
                transferredTo: appointment.transferredTo,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = { createAppointment, updateAppointment, cancelAppointment, retrieveAppointments,
                   retrieveCancelledAppointments, updateAppointmentStatus, getUpcomingAppointments,
                   getDoneAppointments, transferAppointment, getTransferredAppointments };
