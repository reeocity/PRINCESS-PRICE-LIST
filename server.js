const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logger to see if requests are hitting the server
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/princess-hotels', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

console.log('Mounting API routes...');
// Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/auth', require('./routes/auth'));
console.log('/api/auth route mounted.');
app.use('/api/outlets', require('./routes/outlets'));
console.log('/api/outlets route mounted.');
app.use('/api/users', require('./routes/users'));
console.log('/api/users route mounted.');

// Serve static assets in production
/*
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}
*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 