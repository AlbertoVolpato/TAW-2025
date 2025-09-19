const mongoose = require('mongoose');
require('dotenv').config();

// Import models from compiled JavaScript
const { Flight } = require('./dist/models');
const { Airport } = require('./dist/models');
const { Airline } = require('./dist/models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taw-2025', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  createManyTestFlights();
});

// Airline codes and names
const airlines = [
  { code: 'AZ', name: 'Alitalia' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'BA', name: 'British Airways' },
  { code: 'KL', name: 'KLM' },
  { code: 'IB', name: 'Iberia' },
  { code: 'LX', name: 'Swiss International Air Lines' },
  { code: 'OS', name: 'Austrian Airlines' },
  { code: 'SN', name: 'Brussels Airlines' },
  { code: 'TP', name: 'TAP Air Portugal' },
  { code: 'FR', name: 'Ryanair' },
  { code: 'U2', name: 'easyJet' },
  { code: 'W6', name: 'Wizz Air' },
  { code: 'VY', name: 'Vueling' }
];

// Aircraft types
const aircraftTypes = [
  { model: 'Airbus A320', capacity: 180 },
  { model: 'Airbus A321', capacity: 220 },
  { model: 'Airbus A330', capacity: 290 },
  { model: 'Airbus A350-900', capacity: 325 },
  { model: 'Boeing 737-800', capacity: 189 },
  { model: 'Boeing 777-200', capacity: 314 },
  { model: 'Boeing 787-8', capacity: 242 },
  { model: 'Embraer E190', capacity: 114 }
];

// Popular routes (origin -> destinations)
const popularRoutes = {
  'FCO': ['CDG', 'LHR', 'FRA', 'MAD', 'BCN', 'AMS', 'MUC', 'ZUR', 'VIE', 'BRU'],
  'MXP': ['CDG', 'LHR', 'FRA', 'MAD', 'BCN', 'AMS', 'MUC', 'ZUR', 'VIE', 'BRU'],
  'CDG': ['FCO', 'MXP', 'LHR', 'FRA', 'MAD', 'BCN', 'AMS', 'MUC', 'ZUR', 'VIE'],
  'LHR': ['FCO', 'MXP', 'CDG', 'FRA', 'MAD', 'BCN', 'AMS', 'MUC', 'ZUR', 'VIE'],
  'FRA': ['FCO', 'MXP', 'CDG', 'LHR', 'MAD', 'BCN', 'AMS', 'MUC', 'ZUR', 'VIE'],
  'MAD': ['FCO', 'MXP', 'CDG', 'LHR', 'FRA', 'BCN', 'AMS', 'MUC', 'ZUR', 'VIE'],
  'BCN': ['FCO', 'MXP', 'CDG', 'LHR', 'FRA', 'MAD', 'AMS', 'MUC', 'ZUR', 'VIE'],
  'AMS': ['FCO', 'MXP', 'CDG', 'LHR', 'FRA', 'MAD', 'BCN', 'MUC', 'ZUR', 'VIE']
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(base, variation = 0.3) {
  const factor = 1 + (Math.random() - 0.5) * variation;
  return Math.round(base * factor);
}

function generateRandomDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

function generateSeats(capacity, basePrice) {
  const seats = [];
  const rows = Math.ceil(capacity / 6);
  
  for (let row = 1; row <= rows; row++) {
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < Math.min(6, capacity - (row - 1) * 6); i++) {
      const seatNumber = `${row}${seatLetters[i]}`;
      const isAvailable = Math.random() > 0.3; // 70% available
      const price = getRandomPrice(basePrice, 0.2);
      
      seats.push({
        seatNumber,
        class: 'economy',
        isAvailable,
        price
      });
    }
  }
  
  return seats;
}

async function createManyTestFlights() {
  try {
    console.log('Fetching airports and airlines...');
    
    // Get all airports and airlines from database
    const airports = await Airport.find({ isActive: true });
    const existingAirlines = await Airline.find({ isActive: true });
    
    console.log(`Found ${airports.length} airports and ${existingAirlines.length} airlines`);
    
    // Create a map for quick airport lookup
    const airportMap = {};
    airports.forEach(airport => {
      airportMap[airport.code] = airport;
    });
    
    // Create airline map
    const airlineMap = {};
    existingAirlines.forEach(airline => {
      airlineMap[airline.code] = airline;
    });
    
    const flights = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    
    console.log('Generating flights...');
    
    // Generate flights for each popular route
    Object.keys(popularRoutes).forEach(originCode => {
      if (!airportMap[originCode]) return;
      
      const destinations = popularRoutes[originCode];
      
      destinations.forEach(destCode => {
        if (!airportMap[destCode]) return;
        
        // Generate multiple flights per route (different dates and times)
        for (let i = 0; i < 50; i++) { // 50 flights per route
          const airline = getRandomElement(airlines);
          const aircraft = getRandomElement(aircraftTypes);
          
          // Skip if airline doesn't exist in database
          if (!airlineMap[airline.code]) return;
          
          const departureDate = generateRandomDate(startDate, endDate);
          const departureHour = getRandomNumber(6, 22);
          const departureMinute = getRandomNumber(0, 59);
          
          departureDate.setHours(departureHour, departureMinute, 0, 0);
          
          // Calculate flight duration based on distance (rough estimate)
          const baseDuration = getRandomNumber(90, 300); // 1.5 to 5 hours
          const arrivalDate = new Date(departureDate.getTime() + baseDuration * 60000);
          
          // Generate base prices
          const baseEconomyPrice = getRandomNumber(80, 400);
          const baseBusinessPrice = Math.round(baseEconomyPrice * 3.5);
          const baseFirstPrice = Math.round(baseEconomyPrice * 6);
          
          // Generate flight number
          const flightNumber = `${airline.code}${getRandomNumber(1000, 9999)}`;
          
          // Generate seats
          const seats = generateSeats(aircraft.capacity, baseEconomyPrice);
          
          const flight = {
            flightNumber,
            airline: airlineMap[airline.code]._id,
            departureAirport: airportMap[originCode]._id,
            arrivalAirport: airportMap[destCode]._id,
            departureTime: departureDate,
            arrivalTime: arrivalDate,
            duration: baseDuration,
            aircraft: {
              model: aircraft.model,
              capacity: aircraft.capacity
            },
            seats,
            basePrice: {
              economy: baseEconomyPrice,
              business: baseBusinessPrice,
              first: baseFirstPrice
            },
            status: 'scheduled',
            gate: `${getRandomElement(['A', 'B', 'C', 'D'])}${getRandomNumber(1, 30)}`,
            terminal: `${getRandomNumber(1, 3)}`,
            baggage: {
              carryOn: {
                maxWeight: 8,
                maxDimensions: '55x40x20 cm'
              },
              checked: {
                included: 1,
                maxWeight: 23,
                extraBagPrice: getRandomNumber(25, 60)
              }
            },
            services: {
              meal: Math.random() > 0.3,
              wifi: Math.random() > 0.4,
              entertainment: Math.random() > 0.2,
              extraLegroom: Math.random() > 0.7
            },
            isActive: true
          };
          
          flights.push(flight);
        }
      });
    });
    
    console.log(`Generated ${flights.length} flights. Inserting into database...`);
    
    // Insert flights in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < flights.length; i += batchSize) {
      const batch = flights.slice(i, i + batchSize);
      try {
        await Flight.insertMany(batch);
        inserted += batch.length;
        console.log(`Inserted ${inserted}/${flights.length} flights...`);
      } catch (error) {
        console.error(`Error inserting batch ${i}-${i + batchSize}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully created ${inserted} test flights!`);
    
    // Show some statistics
    const totalFlights = await Flight.countDocuments();
    console.log(`📊 Total flights in database: ${totalFlights}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test flights:', error);
    process.exit(1);
  }
}