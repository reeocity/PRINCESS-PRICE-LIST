const express = require('express');
const router = express.Router();
const Outlet = require('../models/Outlet');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/outlets/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Get all outlets (public)
router.get('/', async (req, res) => {
    try {
        const outlets = await Outlet.find();
        res.json(outlets);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get single outlet (public)
router.get('/:id', async (req, res) => {
    try {
        const outlet = await Outlet.findById(req.params.id);
        if (!outlet) return res.status(404).json({ message: 'Outlet not found.' });
        res.json(outlet);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create outlet (admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, openingHours, location } = req.body;
        if (!name || !description || !openingHours || !location || !req.file) {
            return res.status(400).json({ message: 'All fields and image are required.' });
        }
        const outlet = new Outlet({
            name,
            description,
            openingHours,
            location,
            image: '/uploads/outlets/' + req.file.filename
        });
        await outlet.save();
        res.status(201).json({ message: 'Outlet created!', outlet });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update outlet (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, openingHours, location } = req.body;
        const updateData = { name, description, openingHours, location };
        if (req.file) {
            updateData.image = '/uploads/outlets/' + req.file.filename;
        }
        const outlet = await Outlet.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!outlet) return res.status(404).json({ message: 'Outlet not found.' });
        res.json({ message: 'Outlet updated!', outlet });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete outlet (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const outlet = await Outlet.findByIdAndDelete(req.params.id);
        if (!outlet) return res.status(404).json({ message: 'Outlet not found.' });
        res.json({ message: 'Outlet deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router; 