const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Flight } = require('./dist/models/Flight');
const { Airline } = require('./dist/models/Airline');
const { Airport } = require('./dist/models/Airport');

async function createFlightsSepOct2025() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taw_airline');
    console.log('Connected to MongoDB');

    // Get existing airports and airlines
    const airports = await Airport.find({}).limit(10);
    const airlines = await Airline.find({}).limit(5);
    
    if (airports.length < 2) {
      console.error('Need at least 2 airports in database. Run populate-airports.js first.');
      return;
    }
    
    if (airlines.length < 1) {
      console.error('Need at least 1 airline in database.');
      return;
    }

    console.log(`Found ${airports.length} airports and ${airlines.length} airlines`);

    // Delete existing flights for Sep-Oct 2025
    const startDate = new Date('2025-09-01');
    const endDate = new Date('2025-10-31T23:59:59');
    
    await Flight.deleteMany({
      departureTime: {
        $gte: startDate,
        $lte: endDate
      }
    });
    console.log('Deleted existing flights for Sep-Oct 2025');

    const flights = [];
    let flightCounter = 1000;

    // Aircraft types with different capacities
    const aircraftTypes = [
      { model: 'Airbus A320', capacity: 180 },
      { model: 'Boeing 737-800', capacity: 189 },
      { model: 'Airbus A321', capacity: 220 },
      { model: 'Boeing 777-300ER', capacity: 396 },
      { model: 'Airbus A350-900', capacity: 325 }
    ];

    // Generate flights for each day in September and October 2025
    for (let month = 9; month <= 10; month++) {
      const daysInMonth = month === 9 ? 30 : 31;
      
      for (let day = 1; day <= daysInMonth; day++) {
        // Generate 3-8 flights per day
        const flightsPerDay = Math.floor(Math.random() * 6) + 3;
        
        for (let flightOfDay = 0; flightOfDay < flightsPerDay; flightOfDay++) {
          // Random departure time between 6:00 and 22:00
          const hour = Math.floor(Math.random() * 16) + 6;
          const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
          
          const departureTime = new Date(2025, month - 1, day, hour, minute);
          
          // Random flight duration between 1-8 hours
          const durationMinutes = (Math.floor(Math.random() * 7) + 1) * 60 + Math.floor(Math.random() * 4) * 15;
          const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60000);
          
          // Random airports (ensure different departure and arrival)
          const departureAirport = airports[Math.floor(Math.random() * airports.length)];
          let arrivalAirport;
          do {
            arrivalAirport = airports[Math.floor(Math.random() * airports.length)];
          } while (arrivalAirport._id.equals(departureAirport._id));
          
          // Random airline
          const airline = airlines[Math.floor(Math.random() * airlines.length)];
          
          // Random aircraft
          const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
          
          // Generate flight number (format: XX123 or XX1234)
          const flightNum = (flightCounter % 9000) + 100; // Ensures 3-4 digits (100-9099)
          const airlineCode = airline.code.substring(0, 2); // Use only first 2 characters
          const flightNumber = `${airlineCode}${flightNum}`;
          
          flightCounter++;
          
          // Random base prices
          const economyPrice = Math.floor(Math.random() * 300) + 100; // 100-400€
          const businessPrice = Math.floor(economyPrice * 2.5 + Math.random() * 200); // ~2.5x economy
          const firstPrice = Math.floor(businessPrice * 1.8 + Math.random() * 500); // ~1.8x business
          
          // Generate some seats (simplified for performance)
          const seats = [];
          const seatClasses = [
            { class: 'economy', count: Math.floor(aircraft.capacity * 0.8), basePrice: economyPrice },
            { class: 'business', count: Math.floor(aircraft.capacity * 0.15), basePrice: businessPrice },
            { class: 'first', count: Math.floor(aircraft.capacity * 0.05), basePrice: firstPrice }
          ];
          
          let seatNumber = 1;
          seatClasses.forEach(seatClass => {
            for (let i = 0; i < seatClass.count; i++) {
              const row = Math.ceil(seatNumber / 6);
              const seatLetter = String.fromCharCode(65 + (seatNumber - 1) % 6); // A, B, C, D, E, F
              
              seats.push({
                seatNumber: `${row}${seatLetter}`,
                class: seatClass.class,
                isAvailable: Math.random() > 0.3, // 70% availability
                price: seatClass.basePrice + Math.floor(Math.random() * 50) - 25 // ±25€ variation
              });
              
              seatNumber++;
            }
          });
          
          // Create flight object
          const flight = {
            flightNumber,
            airline: airline._id,
            departureAirport: departureAirport._id,
            arrivalAirport: arrivalAirport._id,
            departureTime,
            arrivalTime,
            duration: durationMinutes,
            aircraft: {
              model: aircraft.model,
              capacity: aircraft.capacity
            },
            seats: seats.slice(0, 50), // Limit seats for performance
            basePrice: {
              economy: economyPrice,
              business: businessPrice,
              first: firstPrice
            },
            baggage: {
              carryOn: {
                maxWeight: 8,
                maxDimensions: '55x40x20 cm'
              },
              checked: {
                included: 1,
                maxWeight: 23,
                extraBagPrice: Math.floor(Math.random() * 30) + 30 // 30-60€
              }
            },
            services: {
              meal: Math.random() > 0.3,
              wifi: Math.random() > 0.4,
              entertainment: Math.random() > 0.2,
              extraLegroom: Math.random() > 0.7
            },
            status: 'scheduled',
            isActive: true
          };
          
          flights.push(flight);
        }
      }
    }

    console.log(`Generated ${flights.length} flights for Sep-Oct 2025`);
    
    // Insert flights in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < flights.length; i += batchSize) {
      const batch = flights.slice(i, i + batchSize);
      await Flight.insertMany(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(flights.length / batchSize)}`);
    }

    console.log(`Successfully created ${flights.length} flights for September and October 2025!`);
    
  } catch (error) {
    console.error('Error creating flights:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createFlightsSepOct2025();