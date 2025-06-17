const express = require('express');
const router = express.Router();
const SlideshowImage = require('../models/SlideshowImage');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const DatauriParser = require('datauri/parser');
const path = require('path');

// Configure Cloudinary (ensure these are set as environment variables)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const parser = new DatauriParser();

// Multer storage for memory buffer (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST /api/slideshow/upload
// @desc    Upload a new slideshow image (Admin only)
// @access  Private
router.post('/upload', adminAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        const fileBuffer = req.file.buffer;
        const fileExtension = path.extname(req.file.originalname).toString();
        const dataUri = parser.format(fileExtension, fileBuffer);

        const cloudinaryResult = await cloudinary.uploader.upload(dataUri.content, {
            folder: 'slideshow', // Folder in Cloudinary
        });

        const newImage = new SlideshowImage({
            imageUrl: cloudinaryResult.secure_url,
            caption: req.body.caption || '',
            order: req.body.order || 0,
            isActive: req.body.isActive === 'true' // Convert string to boolean
        });

        await newImage.save();
        res.status(201).json(newImage);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during image upload.', error: err.message });
    }
});

// @route   GET /api/slideshow
// @desc    Get all slideshow images
// @access  Public
router.get('/', async (req, res) => {
    try {
        const images = await SlideshowImage.find().sort({ order: 1, createdAt: 1 });
        res.json(images);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/slideshow/:id
// @desc    Get a single slideshow image by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const image = await SlideshowImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Slideshow image not found.' });
        }
        res.json(image);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/slideshow/:id
// @desc    Update a slideshow image (Admin only)
// @access  Private
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        let image = await SlideshowImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Slideshow image not found.' });
        }

        // Handle new image upload if provided
        if (req.file) {
            const fileBuffer = req.file.buffer;
            const fileExtension = path.extname(req.file.originalname).toString();
            const dataUri = parser.format(fileExtension, fileBuffer);

            const cloudinaryResult = await cloudinary.uploader.upload(dataUri.content, {
                folder: 'slideshow', // Folder in Cloudinary
            });
            image.imageUrl = cloudinaryResult.secure_url;
        }

        // Update other fields
        if (req.body.caption !== undefined) image.caption = req.body.caption;
        if (req.body.order !== undefined) image.order = parseInt(req.body.order);
        if (req.body.isActive !== undefined) image.isActive = req.body.isActive === 'true';

        await image.save();
        res.json(image);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during image update.', error: err.message });
    }
});

// @route   DELETE /api/slideshow/:id
// @desc    Delete a slideshow image (Admin only)
// @access  Private
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const image = await SlideshowImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Slideshow image not found.' });
        }

        // Optionally, delete from Cloudinary as well
        const publicId = image.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`slideshow/${publicId}`);

        await image.deleteOne(); // Use deleteOne() or deleteMany() instead of remove()
        res.json({ message: 'Slideshow image removed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 