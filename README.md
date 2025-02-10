# Doctors Appointment Booking CRM

The **Doctors Appointment Booking CRM** is an advanced platform designed to streamline healthcare management by enabling efficient user management, doctor appointment scheduling, hospital data management, and patient reports. The system ensures seamless interaction between patients, doctors, and administrators while focusing on security, scalability, and user convenience.


## Features

### User Management API
1. **Register User**: Allows users (patients, doctors, admin) to register for the platform.
2. **Login**: Secure authentication for users using JWT (JSON Web Tokens).
3. **Edit User Profile**: Update personal details, including contact info, address, etc.
4. **Delete User**: Admins can delete users from the system.
5. **Retrieve Users**: Admin can retrieve a list of all registered users.
6. **Fetch User**: Fetch specific user profile.
7. **Refresh Token**: Renew JWT tokens for active sessions.
8. **Logout**: Secure logout functionality.
9. **Forgot Password**: Forgot password functionality.
10. **Password Reset**: Password recovery through email.

### Hospital Management API
1. **Add Hospital**: Add new hospital records with detailed information.
2. **Update Hospital**: Modify existing hospital details.
3. **Delete Hospital**: Remove hospital records from the system.
4. **Retrieve All Hospitals**: Fetch a list of all registered hospitals.
5. **Search Hospitals**: Search hospitals by name, address, and departments.

### Doctor Management API
1. **Add Doctor**: Register new doctors to the system with their specialties.
2. **Update Doctor Info**: Modify doctor details (e.g., qualifications, availability).
3. **Retrieve Doctor Info**: Fetch information about doctors, including their schedules.
4. **Delete Doctor**: Remove doctor records if no longer needed.
5. **Search Doctor**: Search doctors by name and specialty.

### Appointment Scheduling API
1. **Create Appointment**: Patients can book appointments with available doctors.
2. **Update Appointment**: Modify appointment details, such as rescheduling.
3. **Cancel Appointment**: Allow users to cancel appointments.
4. **Retrieve Appointments**: Fetch appointment details for patients, doctors, or admins.
5. **Retrieve Cancelled Appointments**: Fetch all cancelled appointments.
6. **Appointment Status**: Track the status of appointments (e.g., upcoming, done, canceled).
7. **Retrieve Upcoming Appointments**: Fetch all upcoming status appointments.
8. **Retrieve Done Appointments**: Fetch all done status appointments.
9. **Transfer Appointment**: Reschedule appointments with a different doctor.
10. **Get Transferred Appointments**: Track previously transferred appointments.
11.  **Fetch Doctor Availability**: Get Doctor Availability based on Done Status.

### Feedback API
1. **Add Feedback**: Add feedback for doctors or hospitals.
2. **Get Feedbacks for a Doctor**: Fetch feedbacks for a specific doctor.
3. **Get Feedback for a Hospital**: Fetch feedbacks for a specific hospital.



## Technologies Used
- **Backend Framework**: Node.js with Express.js
- **Database**: MongoDB, Redis (for caching)
- **Authentication**: JSON Web Tokens (JWT)
- **Email Services**: Nodemailer
- **API Testing**: Postman
- **Version Control**: Git and GitHub



## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB and Redis installed


## Installation and Setup
- Clone the repository
```
git clone https://github.com/surajmendhe5573/Doctors-Appointment-Booking--CRM

```
- Install dependencies
```
cd <Doctors-Appointment-Booking--CRM>
npm install
```
- Build and run the project
```
npm start
```


## Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```
# Port
PORT=5000

# Database Connection
MONGO_URI=mongodb://localhost:27017/defaultdb


# JWT Secrets
JWT_SECRET=your_jwt_auth_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email credentials
EMAIL=your_email@example.com
EMAIL_PASSWORD=your_email_password

```


## 🚀 About Me
I'm a Backend developer...


## 🔗 Links
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://github.com/surajmendhe5573)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/suraj-mendhe-569879233/?original_referer=https%3A%2F%2Fsearch%2Eyahoo%2Ecom%2F&originalSubdomain=in)
[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/)
