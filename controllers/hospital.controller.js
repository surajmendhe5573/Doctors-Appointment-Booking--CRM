const Hospital= require('../models/hospital.model');

const addHospital= async(req, res)=>{
        try {
            const {name, address, contactNumber, departments}= req.body;

            if(!name ||  !address || !contactNumber || !departments){
                return res.status(400).json({message: 'All fields are required'});
            }

            if(req.user.role !== 'Admin'){
                return res.status(403).json({message: 'Access denied. Only admins can add hospitals.'});
            }

            const newHospital= await new Hospital({
                name,
                address,
                contactNumber,
                departments
            });

            await newHospital.save();
            res.status(201).json({message: 'Hospital added successfully', hospital: newHospital});
            
        } catch (error) {
            res.status(500).json({message: 'Internal server error'});
        }
};

module.exports= addHospital;