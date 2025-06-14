const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


// Load environment variables
dotenv.config();

// Log environment variables (safely)
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logger to see if requests are hitting the server
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// MongoDB Connection with better error handling
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Attempting to connect to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        
        console.log(`MongoDB Connected Successfully!`);
        console.log(`Host: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        
        // Log connection state
        console.log('Connection state:', mongoose.connection.readyState);
        
        // Add connection error handler
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        // Add disconnection handler
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        // Log the connection string (without password) for debugging
        const uri = process.env.MONGODB_URI;
        const sanitizedUri = uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@') : 'not set';
        console.error('Connection string:', sanitizedUri);
        console.error('Full error details:', error.message);
        process.exit(1); // Exit with failure
    }
};

// Connect to MongoDB
connectDB();

console.log('Mounting API routes...');
// Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/auth', require('./routes/auth'));
console.log('/api/auth route mounted.');
app.use('/api/outlets', require('./routes/outlets'));
console.log('/api/outlets route mounted.');
app.use('/api/users', require('./routes/users'));
console.log('/api/users route mounted.');

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 