const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');

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

        // Check if the doctor is available on the given date and time
        const isDoctorAvailable = doctor.availability.days.includes(new Date(date).toLocaleDateString('en-US', { weekday: 'long' })) &&
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
      const { doctor, date, timeSlot, status } = req.body;
  
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
        ) && existingDoctor.availability.timeSlots.includes(timeSlot || appointment.timeSlot);
  
        if (!isDoctorAvailable) {
          return res.status(400).json({ message: 'Doctor is not available at the selected date and time.' });
        }
  
        const conflictingAppointment = await Appointment.findOne({
          doctor,
          date: date || appointment.date,
          timeSlot: timeSlot || appointment.timeSlot,
          status: { $in: ['Scheduled', 'Upcoming'] },
        });
  
        if (conflictingAppointment) {
          return res.status(400).json({ message: 'The doctor is already booked for this time slot.' });
        }
  
        appointment.doctor = doctor;
      }
  
      if (date || timeSlot) {
        const existingDoctor = await Doctor.findById(appointment.doctor);
  
        const isDoctorAvailable = existingDoctor.availability.days.includes(
          new Date(date || appointment.date).toLocaleDateString('en-US', { weekday: 'long' })
        ) && existingDoctor.availability.timeSlots.includes(timeSlot || appointment.timeSlot);
  
        if (!isDoctorAvailable) {
          return res.status(400).json({ message: 'Doctor is not available at the selected date and time.' });
        }
  
        const conflictingAppointment = await Appointment.findOne({
          doctor: appointment.doctor,
          date: date || appointment.date,
          timeSlot: timeSlot || appointment.timeSlot,
          status: { $in: ['Scheduled', 'Upcoming'] },
          _id: { $ne: appointmentId }, 
        });
  
        if (conflictingAppointment) {
          return res.status(400).json({ message: 'The doctor is already booked for this time slot.' });
        }
  
        appointment.date = date || appointment.date;
        appointment.timeSlot = timeSlot || appointment.timeSlot;
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
          timeSlot: populatedAppointment.timeSlot,
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
  
module.exports = { createAppointment, updateAppointment, cancelAppointment };
