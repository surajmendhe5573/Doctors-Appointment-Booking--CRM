const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');

const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, date, time } = req.body;

        if (req.user.role !== 'Patient') {
            return res.status(403).json({ message: 'Access denied. Only Patient can create appointments.' });
        }

        // Validate patient
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'Patient') {
            return res.status(400).json({ message: 'Invalid patient ID or the user is not a patient.' });
        }

        // Validate doctor
        const doctor = await Doctor.findById(doctorId);
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

        // Create a new appointment
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
            .populate('patient', 'name') // Populate patient name
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name' // Populate doctor's user name
                }
            });

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment: {
                _id: populatedAppointment._id,
                patientName: populatedAppointment.patient?.name, // Safely access name
                doctorName: populatedAppointment.doctor?.user?.name, // Safely access doctor's user name
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

module.exports = { createAppointment };
