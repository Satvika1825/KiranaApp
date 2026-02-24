const mongoose = require('mongoose');
require('dotenv').config();

const Apartment = require('./models/apartment');
const BulkOrderWindow = require('./models/bulkOrderWindow');

const seedApartments = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Clear existing apartments
    await Apartment.deleteMany({});
    await BulkOrderWindow.deleteMany({});

    // Create sample apartments
    const apartments = await Apartment.insertMany([
      {
        name: 'Riverside Apartments',
        address: '123 Main Street, Downtown',
        area: 'Downtown',
        city: 'Metro City',
        postalCode: '110001',
        totalFamilies: 150,
        registeredFamilies: 89,
        isActive: true,
        deliveryRadius: 5,
      },
      {
        name: 'Green Valley Society',
        address: '456 Park Avenue, Suburbs',
        area: 'Suburbs',
        city: 'Metro City',
        postalCode: '110002',
        totalFamilies: 200,
        registeredFamilies: 142,
        isActive: true,
        deliveryRadius: 8,
      },
      {
        name: 'Sunset Heights',
        address: '789 Hill Road, North Zone',
        area: 'North Zone',
        city: 'Metro City',
        postalCode: '110003',
        totalFamilies: 100,
        registeredFamilies: 67,
        isActive: true,
        deliveryRadius: 6,
      },
      {
        name: 'Ocean View Towers',
        address: '321 Waterfront, East District',
        area: 'East District',
        city: 'Metro City',
        postalCode: '110004',
        totalFamilies: 250,
        registeredFamilies: 189,
        isActive: true,
        deliveryRadius: 10,
      },
    ]);

    console.log(`✅ Created ${apartments.length} apartments`);

    // Create sample order windows for each apartment
    const windows = [];
    for (const apt of apartments) {
      windows.push({
        apartment: apt._id,
        name: `${apt.name} - Morning Order Window`,
        startTime: '08:00',
        endTime: '12:00',
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true,
      });
      windows.push({
        apartment: apt._id,
        name: `${apt.name} - Evening Order Window`,
        startTime: '17:00',
        endTime: '20:00',
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true,
      });
      windows.push({
        apartment: apt._id,
        name: `${apt.name} - Weekend Window`,
        startTime: '09:00',
        endTime: '18:00',
        daysOfWeek: ['Saturday', 'Sunday'],
        isActive: true,
      });
    }

    await BulkOrderWindow.insertMany(windows);
    console.log(`✅ Created ${windows.length} order windows`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
};

seedApartments();
