const Hospital= require('../models/hospital.model');
const client= require('../utils/redisClient');

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
};

const fetchAllHospitals= async(req, res)=>{
    try {

        if(req.user.role !== 'Admin' && req.user.role !== 'Patient'){
            return res.status(403).json({message: 'Only admins and patients can see hospitals'});
        }

        const cachedHospitals= await client.get('all_hospitals');
        if(cachedHospitals){
            return res.status(200).json({mesage: 'Hospitals fetched successfully (cached)', data:JSON.parse(cachedHospitals)});
        }

        const hospitals= await Hospital.find();

        await client.set('all_hospitals', JSON.stringify(hospitals), {EX: 3600});
        res.status(200).json({message: 'Hospitals fetched successfully', data: hospitals});
        
    } catch (error) {
       res.status(500).json({message: 'Internal server error'}); 
    }
}

const searchHospitals = async (req, res) => {
    try {
        const { name, address, departments } = req.query;

        const searchCriteria = {};

        if (name && name.trim() !== '') {
            searchCriteria.name = { $regex: name, $options: 'i' }; 
        }

        if (address && address.trim() !== '') {
            searchCriteria.address = { $regex: address, $options: 'i' }; 
        }

        if (departments && departments.trim() !== '') {
            const departmentList = departments.split(',').map(dep => dep.trim());
            searchCriteria.departments = { $in: departmentList }; 
        }

        if (Object.keys(searchCriteria).length === 0) {
            return res.status(400).json({ message: 'Please provide at least one search criteria (name, address, or departments).' });
        }

        const hospitals = await Hospital.find(searchCriteria);

        if (hospitals.length === 0) {
            return res.status(404).json({ message: 'No hospitals found matching the search criteria.' });
        }

        res.status(200).json({ message: 'Hospitals fetched successfully', data: hospitals });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports= {addHospital, updateHospital, deleteHospital, fetchAllHospitals, searchHospitals};