# `Pool Management System Server (pms-server)`

This is the backend server for the Pool Management System, an ongoing project for managing a pool facility, including user registrations, reservations, and more.


## 🌐 Test Running Application @ https://www.pool-ms.com/
```plaintext

Test Credentials
Admin User
Username: admin

Password: 123456

Regular User
Username: user1

Password: 123456

✨ Features
User registration and authentication
Reservation system for pool activities
Check-in and activity tracking


🛠 Technologies Used
Node.js
Express
PostgreSQL
Nginx


🚀 Getting Started
Prerequisites
Ensure you have the following installed:

Node.js
PostgreSQL
1. Clone the Repositories
Clone the server and client repositories into the same project directory:

git clone https://github.com/MarkOfosu/pms-server.git

2. Install Dependencies
Navigate into both the server directory and install the necessary dependencies:

# For the server
cd pms-server
npm install


3. Set Up Environment Variables
Create a .env file in the pms-server directory using the variables in .env.example.

4. Set Up PostgreSQL Database
Create a PostgreSQL database and update the .env file with the correct credentials.

5. Update Frontend Build
The frontend is served by the backend. To update the frontend build:

# Run this command in the client directory
npm run build

6. Start the Server
Navigate to the pms-server directory and start the server:
npm run server


7. Access the Application
Open your browser and go to:
http://localhost:5000
