const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Flight } = require('./dist/models/Flight');
const { Airline } = require('./dist/models/Airline');
const { Airport } = require('./dist/models/Airport');

async function createTestFlights() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taw_airline');
    console.log('Connected to MongoDB');

    // Find or create airports
    let fcoAirport = await Airport.findOne({ code: 'FCO' });
    if (!fcoAirport) {
      fcoAirport = new Airport({
        name: 'Leonardo da Vinci International Airport',
        code: 'FCO',
        city: 'Rome',
        country: 'Italy',
        timezone: 'Europe/Rome'
      });
      await fcoAirport.save();
      console.log('Created FCO airport');
    }

    let mxpAirport = await Airport.findOne({ code: 'MXP' });
    if (!mxpAirport) {
      mxpAirport = new Airport({
        name: 'Milan Malpensa Airport',
        code: 'MXP',
        city: 'Milan',
        country: 'Italy',
        timezone: 'Europe/Rome'
      });
      await mxpAirport.save();
      console.log('Created MXP airport');
    }

    // Find or create airline
    let airline = await Airline.findOne({ code: 'AZ' });
    if (!airline) {
      airline = new Airline({
        name: 'ITA Airways',
        code: 'AZ',
        country: 'Italy',
        isActive: true
      });
      await airline.save();
      console.log('Created ITA Airways airline');
    }

    // Delete existing test flights
    await Flight.deleteMany({ flightNumber: { $in: ['AZ101', 'AZ102'] } });
    console.log('Deleted existing test flights');

    // Create test flights
    const flight1 = new Flight({
      flightNumber: 'AZ101',
      airline: airline._id,
      departureAirport: fcoAirport._id,
      arrivalAirport: mxpAirport._id,
      departureTime: new Date('2024-12-25T08:00:00Z'),
      arrivalTime: new Date('2024-12-25T09:30:00Z'),
      duration: 90,
      aircraft: {
        model: 'Airbus A320',
        capacity: 180
      },
      seats: [
        { seatNumber: '1A', class: 'first', isAvailable: true, price: 800 },
        { seatNumber: '1B', class: 'first', isAvailable: true, price: 800 },
        { seatNumber: '2A', class: 'business', isAvailable: true, price: 450 },
        { seatNumber: '2B', class: 'business', isAvailable: true, price: 450 },
        { seatNumber: '10A', class: 'economy', isAvailable: true, price: 150 },
        { seatNumber: '10B', class: 'economy', isAvailable: true, price: 150 },
        { seatNumber: '10C', class: 'economy', isAvailable: true, price: 150 }
      ],
      basePrice: {
        economy: 150,
        business: 450,
        first: 800
      },
      baggage: {
        carryOn: {
          maxWeight: 8,
          maxDimensions: '55x40x20 cm'
        },
        checked: {
          included: 1,
          maxWeight: 23,
          extraBagPrice: 50
        }
      },
      services: {
        meal: true,
        wifi: true,
        entertainment: true,
        extraLegroom: false
      },
      status: 'scheduled',
      isActive: true
    });

    const flight2 = new Flight({
      flightNumber: 'AZ102',
      airline: airline._id,
      departureAirport: mxpAirport._id,
      arrivalAirport: fcoAirport._id,
      departureTime: new Date('2024-12-25T18:00:00Z'),
      arrivalTime: new Date('2024-12-25T19:30:00Z'),
      duration: 90,
      aircraft: {
        model: 'Airbus A320',
        capacity: 180
      },
      seats: [
        { seatNumber: '1A', class: 'first', isAvailable: true, price: 800 },
        { seatNumber: '1B', class: 'first', isAvailable: true, price: 800 },
        { seatNumber: '2A', class: 'business', isAvailable: true, price: 450 },
        { seatNumber: '2B', class: 'business', isAvailable: true, price: 450 },
        { seatNumber: '10A', class: 'economy', isAvailable: true, price: 160 },
        { seatNumber: '10B', class: 'economy', isAvailable: true, price: 160 },
        { seatNumber: '10C', class: 'economy', isAvailable: true, price: 160 }
      ],
      basePrice: {
        economy: 160,
        business: 450,
        first: 800
      },
      baggage: {
        carryOn: {
          maxWeight: 8,
          maxDimensions: '55x40x20 cm'
        },
        checked: {
          included: 1,
          maxWeight: 23,
          extraBagPrice: 50
        }
      },
      services: {
        meal: true,
        wifi: true,
        entertainment: true,
        extraLegroom: false
      },
      status: 'scheduled',
      isActive: true
    });

    await flight1.save();
    console.log('Created flight AZ101');

    await flight2.save();
    console.log('Created flight AZ102');

    console.log('Test flights created successfully!');
    
  } catch (error) {
    console.error('Error creating test flights:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestFlights();