const mongoose = require('mongoose');
const Outlet = require('../models/Outlet');
const dotenv = require('dotenv');

dotenv.config();

const outlets = [
  {
    name: 'Restaurant',
    description: 'A fine dining experience with exquisite cuisine.',
    image: '/uploads/outlets/restaurant.jpg',
    openingHours: '8:00 AM - 10:00 PM',
    location: 'Main Building',
    isActive: true
  },
  {
    name: 'Grill Kitchen',
    description: 'Enjoy grilled specialties and a lively atmosphere.',
    image: '/uploads/outlets/grill-kitchen.jpg',
    openingHours: '12:00 PM - 11:00 PM',
    location: 'Outdoor Area',
    isActive: true
  },
  {
    name: 'Caesar Lounge',
    description: 'Relax with signature cocktails and light bites.',
    image: '/uploads/outlets/caesar-lounge.jpg',
    openingHours: '4:00 PM - 2:00 AM',
    location: 'Lobby Level',
    isActive: true
  },
  {
    name: 'Club Spartacuz',
    description: 'Nightlife, music, and entertainment.',
    image: '/uploads/outlets/club-spartacuz.jpg',
    openingHours: '9:00 PM - 4:00 AM',
    location: 'Annex',
    isActive: true
  },
  {
    name: 'Pool Deck',
    description: 'Chill by the pool with drinks and snacks.',
    image: '/uploads/outlets/pool-deck.jpg',
    openingHours: '10:00 AM - 8:00 PM',
    location: 'Poolside',
    isActive: true
  },
  {
    name: 'Garden Bar',
    description: 'Enjoy nature and refreshments in the garden.',
    image: '/uploads/outlets/garden-bar.jpg',
    openingHours: '3:00 PM - 11:00 PM',
    location: 'Garden Area',
    isActive: true
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  await Outlet.deleteMany({});
  await Outlet.insertMany(outlets);
  console.log('Outlets seeded!');
  mongoose.disconnect();
}

seed(); 