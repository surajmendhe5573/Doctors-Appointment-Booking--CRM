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

const updateHospital= async(req, res)=>{
    try {
        const {id}= req.params;
        const {name, address, contactNumber, departments}= req.body;

        if(req.user.role !== 'Admin'){
            return res.status(403).json({message: 'Access denied. Only admins can add hospitals.'});
        }

        const updates= {};
        if(name) updates.name= name;
        if(address) updates.address= address;
        if(contactNumber) updates.contactNumber= contactNumber;
        if(departments) updates.contactNumber= contactNumber;

        const updateHospital= await Hospital.findByIdAndUpdate(id, updates, {new:true});
        if(!updateHospital){
            return res.status(404).json({message: 'Hospital not found'});
        }

        res.status(200).json({message: 'Hospital updated succssfully', hospital:updateHospital});
    } catch (error) {
      res.status(500).json({message: 'Internal server error'});  
    }
};

const deleteHospital= async(req, res)=>{
    try {
        const {id}= req.params;

        if(req.user.role !== 'Admin'){
            return res.status(403).json({message: 'Access denied. Only admins can add hospitals.'});
        }

        const deleteHospital= await Hospital.findByIdAndDelete(id);
        if(!deleteHospital){
            return res.status(404).json({message: 'Hospital not found'});
        }

        res.status(200).json({message: 'Hospital deleted successsfully'});
        
    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
}

module.exports= {addHospital, updateHospital, deleteHospital};