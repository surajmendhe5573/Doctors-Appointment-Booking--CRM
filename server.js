const express= require('express');
const app= express();
require('dotenv').config();

app.use(express.json());

app.get('/', (req, res)=>{
    res.send('Welcome to the Doctors Appointment Booking CRM Project !');
})

require('./config/DB');

app.use('/api/users', require('./routes/user'));
app.use('/api/hospitals', require('./routes/hospital'));
app.use('/api/doctors', require('./routes/doctor'));
app.use('/api/appointments', require('./routes/appointment'));
app.use('/api/feedbacks', require('./routes/feedback'));


const port= process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`);
})

