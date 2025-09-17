const mongoose = require('mongoose');
require('dotenv').config();

// Schemas
const airlineSchema = new mongoose.Schema({
  name: String,
  code: String,
  country: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const flightSchema = new mongoose.Schema({
  flightNumber: String,
  airline: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline' },
  departureAirport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport' },
  arrivalAirport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport' },
  departureTime: Date,
  arrivalTime: Date,
  duration: Number,
  aircraft: {
    model: String,
    registration: String
  },
  basePrice: {
    economy: Number,
    business: Number,
    first: Number
  },
  seats: [{
    seatNumber: String,
    class: String,
    isAvailable: Boolean,
    price: Number
  }],
  status: { type: String, default: 'scheduled' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const airportSchema = new mongoose.Schema({
  name: String,
  code: String,
  city: String,
  country: String,
  timezone: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Airline = mongoose.model('Airline', airlineSchema);
const Flight = mongoose.model('Flight', flightSchema);
const Airport = mongoose.model('Airport', airportSchema);

async function populateTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flight-booking');
    console.log('Connected to MongoDB');
    
    // Create test airline
    let airline = await Airline.findOne({ code: 'ITA' });
    if (!airline) {
      airline = new Airline({
        name: 'ITA Airways',
        code: 'ITA',
        country: 'Italia'
      });
      await airline.save();
      console.log('Created airline: ITA Airways');
    }
    
    // Get airports
    const fcoAirport = await Airport.findOne({ code: 'FCO' });
    const mxpAirport = await Airport.findOne({ code: 'MXP' });
    const napAirport = await Airport.findOne({ code: 'NAP' });
    
    if (!fcoAirport || !mxpAirport) {
      console.log('Airports not found. Please run populate-airports.js first.');
      process.exit(1);
    }
    
    // Create test flights
    const testFlights = [
      {
        flightNumber: 'ITA101',
        airline: airline._id,
        departureAirport: fcoAirport._id,
        arrivalAirport: mxpAirport._id,
        departureTime: new Date('2024-12-25T08:00:00Z'),
        arrivalTime: new Date('2024-12-25T09:30:00Z'),
        duration: 90,
        aircraft: {
          model: 'Airbus A320',
          registration: 'EI-IMA',
          capacity: 180
        },
        basePrice: {
          economy: 150,
          business: 450,
          first: 800
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
        }
      },
      {
        flightNumber: 'ITA102',
        airline: airline._id,
        departureAirport: mxpAirport._id,
        arrivalAirport: fcoAirport._id,
        departureTime: new Date('2024-12-25T15:00:00Z'),
        arrivalTime: new Date('2024-12-25T16:30:00Z'),
        duration: 90,
        aircraft: {
          model: 'Airbus A320',
          registration: 'EI-IMB',
          capacity: 180
        },
        basePrice: {
          economy: 160,
          business: 480,
          first: 850
        },
        seats: [
          { seatNumber: '1A', class: 'first', isAvailable: true, price: 850 },
          { seatNumber: '1B', class: 'first', isAvailable: true, price: 850 },
          { seatNumber: '2A', class: 'business', isAvailable: true, price: 480 },
          { seatNumber: '2B', class: 'business', isAvailable: true, price: 480 },
          { seatNumber: '10A', class: 'economy', isAvailable: true, price: 160 },
          { seatNumber: '10B', class: 'economy', isAvailable: true, price: 160 },
          { seatNumber: '10C', class: 'economy', isAvailable: true, price: 160 }
        ],
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
        }
      }
    ];
    
    // Delete existing flights and recreate them
    await Flight.deleteMany({ flightNumber: { $in: ['ITA101', 'ITA102'] } });
    console.log('Deleted existing test flights');

    // Add flights
    for (const flightData of testFlights) {
      const flight = new Flight(flightData);
      await flight.save();
      console.log(`Added flight: ${flightData.flightNumber}`);
    }
    
    console.log('Test data population completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating test data:', error);
    process.exit(1);
  }
}

populateTestData();