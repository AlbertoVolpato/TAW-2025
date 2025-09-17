const mongoose = require('mongoose');
require('dotenv').config();

// Airport schema (simplified)
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

const Airport = mongoose.model('Airport', airportSchema);

// Italian airports data
const airports = [
  {
    name: "Aeroporto di Milano Malpensa",
    code: "MXP",
    city: "Milano",
    country: "Italia",
    timezone: "Europe/Rome",
    coordinates: { latitude: 45.6306, longitude: 8.7281 }
  },
  {
    name: "Aeroporto di Milano Linate",
    code: "LIN",
    city: "Milano",
    country: "Italia",
    timezone: "Europe/Rome",
    coordinates: { latitude: 45.4454, longitude: 9.2767 }
  },
  {
    name: "Aeroporto di Napoli Capodichino",
    code: "NAP",
    city: "Napoli",
    country: "Italia",
    timezone: "Europe/Rome",
    coordinates: { latitude: 40.8860, longitude: 14.2908 }
  },
  {
    name: "Aeroporto di Venezia Marco Polo",
    code: "VCE",
    city: "Venezia",
    country: "Italia",
    timezone: "Europe/Rome",
    coordinates: { latitude: 45.5053, longitude: 12.3519 }
  },
  {
    name: "Aeroporto di Firenze Peretola",
    code: "FLR",
    city: "Firenze",
    country: "Italia",
    timezone: "Europe/Rome",
    coordinates: { latitude: 43.8100, longitude: 11.2051 }
  }
];

async function populateAirports() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flight-booking');
    console.log('Connected to MongoDB');
    
    // Insert airports
    for (const airportData of airports) {
      const existingAirport = await Airport.findOne({ code: airportData.code });
      if (!existingAirport) {
        const airport = new Airport(airportData);
        await airport.save();
        console.log(`Added airport: ${airportData.name} (${airportData.code})`);
      } else {
        console.log(`Airport ${airportData.code} already exists`);
      }
    }
    
    console.log('Airport population completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating airports:', error);
    process.exit(1);
  }
}

populateAirports();