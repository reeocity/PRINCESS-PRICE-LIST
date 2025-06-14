const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Outlet = require('../models/Outlet');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const DatauriParser = require('datauri/parser');

// Configure Cloudinary (ensure these are set as environment variables on Vercel)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const parser = new DatauriParser();

// Multer setup for image upload (using memoryStorage for Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

// Set up multer for Excel file uploads (still temporarily saved to disk for parsing, then unlinked)
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure this directory exists on your local machine for development if needed
        // On Vercel, this is a temporary write, and the file is immediately deleted
        const tempUploadDir = path.join(__dirname, '../public/uploads/temp_excel');
        if (!fs.existsSync(tempUploadDir)) {
            fs.mkdirSync(tempUploadDir, { recursive: true });
        }
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const excelUpload = multer({ storage: excelStorage });

// Get all items (public)
router.get('/', async (req, res) => {
    try {
        const items = await Item.find().populate('outletPrices.outlet');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get items by outlet (public)
router.get('/outlet/:outletId', async (req, res) => {
    try {
        const items = await Item.find({
            'outletPrices.outlet': req.params.outletId
        }).populate('outletPrices.outlet');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get single item (public)
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('outletPrices.outlet');
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create item (admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, outletPrices } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Image file is required.' });
        }

        if (!name || !description || !category || !outletPrices) {
            return res.status(400).json({ message: 'Name, description, category, and outlet prices are required.' });
        }

        const parsedOutletPrices = JSON.parse(outletPrices);
        if (!Array.isArray(parsedOutletPrices) || parsedOutletPrices.length === 0) {
            return res.status(400).json({ message: 'At least one outlet price is required.' });
        }

        // Upload image to Cloudinary
        const fileBuffer = req.file.buffer;
        const fileExtension = path.extname(req.file.originalname).toString();
        const dataUri = parser.format(fileExtension, fileBuffer).content;

        const cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'princess-hotels/items' // Specify a folder in Cloudinary
        });

        const imageUrl = cloudinaryResult.secure_url; // Get the secure URL from Cloudinary

        const item = new Item({
            name,
            description,
            category,
            outletPrices: parsedOutletPrices,
            image: imageUrl
        });

        await item.save();
        res.status(201).json({ message: 'Item created!', item });
    } catch (err) {
        console.error('Error creating item with Cloudinary upload:', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// Update item (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, outletPrices, isAvailable } = req.body;
        const updateData = { name, description, category, isAvailable };

        if (outletPrices) {
            const parsedOutletPrices = JSON.parse(outletPrices);
            if (!Array.isArray(parsedOutletPrices) || parsedOutletPrices.length === 0) {
                return res.status(400).json({ message: 'At least one outlet price is required.' });
            }
            updateData.outletPrices = parsedOutletPrices;
        }

        if (req.file) {
            // Upload new image to Cloudinary
            const fileBuffer = req.file.buffer;
            const fileExtension = path.extname(req.file.originalname).toString();
            const dataUri = parser.format(fileExtension, fileBuffer).content;

            const cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
                folder: 'princess-hotels/items'
            });
            updateData.image = cloudinaryResult.secure_url;
            // No local file deletion needed for Cloudinary
        }

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('outletPrices.outlet');

        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.json({ message: 'Item updated!', item });
    } catch (err) {
        console.error('Error updating item with Cloudinary upload:', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// Delete all items (purge)
router.delete('/purge', adminAuth, async (req, res) => {
    console.log('Attempting to purge all items...');
    try {
        await Item.deleteMany({});
        console.log('All items purged successfully!');
        res.status(200).json({ message: 'All items purged successfully!' });
    } catch (error) {
        console.error('Error purging items:', error);
        res.status(500).json({ message: 'Server error during purge.', error: error.message });
    }
});

// Delete item (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);

        // Optional: Delete image from Cloudinary when item is deleted
        if (item && item.image) {
            // Extract public ID from Cloudinary URL
            const publicId = item.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`princess-hotels/items/${publicId}`);
            console.log(`Deleted image ${publicId} from Cloudinary.`);
        }

        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.json({ message: 'Item deleted.' });
    } catch (err) {
        console.error('Error deleting item (and Cloudinary image):', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// Route to import items from Excel
router.post('/import', adminAuth, excelUpload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Delete the temporary uploaded file
        require('fs').unlinkSync(filePath);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: 'No data found in the Excel file.' });
        }

        const importedItems = [];
        const outletCache = {}; // Cache outlets to reduce DB queries

        for (const row of data) {
            const itemName = row['Item Name']; // Assuming column name is 'Item Name'
            const price = parseFloat(row['Price']); // Assuming column name is 'Price'
            const outletName = row['Outlet/Location']; // Assuming column name is 'Outlet/Location'

            if (!itemName || isNaN(price) || !outletName) {
                console.warn(`Skipping row due to missing data: ${JSON.stringify(row)}`);
                continue; // Skip rows with missing required data
            }

            let outletId;
            if (outletCache[outletName]) {
                outletId = outletCache[outletName];
            } else {
                const outlet = await Outlet.findOne({ name: outletName });
                if (!outlet) {
                    console.warn(`Outlet '${outletName}' not found for item '${itemName}'. Skipping.`);
                    continue;
                }
                outletId = outlet._id;
                outletCache[outletName] = outletId; // Cache the outlet ID
            }

            // Check if item already exists with the same name and in the same outlet
            let existingItem = await Item.findOne({ name: itemName }); // Find by name only to merge all info

            if (existingItem) {
                // Update existing item's general details if provided in Excel
                if (row['Description'] !== undefined) {
                    existingItem.description = row['Description'];
                }
                if (row['Category'] !== undefined) {
                    existingItem.category = row['Category'];
                }

                // Update existing item's price for this outlet or add new outletPrice
                const outletPriceIndex = existingItem.outletPrices.findIndex(op => op.outlet && op.outlet.equals(outletId));
                if (outletPriceIndex > -1) {
                    existingItem.outletPrices[outletPriceIndex].price = price;
                } else {
                    existingItem.outletPrices.push({ outlet: outletId, price: price });
                }
                await existingItem.save();
                importedItems.push(existingItem);
            } else {
                // Create new item
                const newItem = new Item({
                    name: itemName,
                    description: row['Description'] || '', // Assign description from Excel, default to empty string
                    category: row['Category'] || '', // Assign category from Excel, default to empty string
                    outletPrices: [{ outlet: outletId, price: price }],
                    image: '' // Default empty image, can be added later
                });
                await newItem.save();
                importedItems.push(newItem);
            }
        }

        res.status(200).json({ message: 'Items imported successfully!', importedCount: importedItems.length });
    } catch (error) {
        console.error('Error importing items from Excel:', error);
        res.status(500).json({ message: 'Server error during import.', error: error.message });
    }
});

// Test database connection
router.get('/test-connection', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        res.json({
            status: 'success',
            message: 'Database connection test',
            connectionState: stateMap[dbState] || 'unknown',
            readyState: dbState,
            isConnected: dbState === 1
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection test failed',
            error: error.message
        });
    }
});

module.exports = router; 