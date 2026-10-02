# FixUp - Fixers and Installers Xtreme Utility Platform

**FixUp** is a service appointment booking platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It allows users to book various household services like electrician, carpenter, driver, and more.

## Project Structure

- **`frontend/`**: React.js client (Vite, Tailwind CSS, React Router)
- **`backend/`**: Node.js & Express API server (MongoDB, Mongoose, JWT)

## Features

- **User Authentication**: Secure login and registration with JWT.
- **Service Booking**: Browse and book household services.
- **Payment Integration**: Secure payments via Razorpay / Stripe.
- **Admin Dashboard**: Manage services, users, and bookings.

## Technologies Used

- **Frontend**: React.js, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (running locally or MongoDB Atlas connection string)
- npm / yarn

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server runs by default at `http://localhost:8001`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend app runs by default at `http://localhost:5173`.

