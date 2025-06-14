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

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, assetsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Set up multer for file uploads
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/items'); // Save uploaded Excel files here temporarily
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
        if (!name || !description || !category || !outletPrices || !req.file) {
            return res.status(400).json({ message: 'All fields and image are required.' });
        }

        const parsedOutletPrices = JSON.parse(outletPrices);
        if (!Array.isArray(parsedOutletPrices) || parsedOutletPrices.length === 0) {
            return res.status(400).json({ message: 'At least one outlet price is required.' });
        }

        const item = new Item({
            name,
            description,
            category,
            outletPrices: parsedOutletPrices,
            image: '/assets/' + req.file.filename
        });
        await item.save();
        res.status(201).json({ message: 'Item created!', item });
    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).json({ message: 'Server error.' });
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
            // Delete old image if it exists
            const oldItem = await Item.findById(req.params.id);
            if (oldItem && oldItem.image) {
                const oldImagePath = path.join(__dirname, '..', oldItem.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.image = '/assets/' + req.file.filename;
        }

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('outletPrices.outlet');

        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.json({ message: 'Item updated!', item });
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).json({ message: 'Server error.' });
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
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.json({ message: 'Item deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
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