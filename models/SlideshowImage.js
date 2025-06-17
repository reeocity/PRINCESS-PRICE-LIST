const mongoose = require('mongoose');

const SlideshowImageSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: false
    },
    order: {
        type: Number,
        required: true,
        default: 0 // Default order, can be customized by admin
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SlideshowImage', SlideshowImageSchema); 