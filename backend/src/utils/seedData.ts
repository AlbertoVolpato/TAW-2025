import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Airport } from '../models/Airport';
import { Airline } from '../models/Airline';
import bcrypt from 'bcryptjs';

// Sample airports data
const airportsData = [
  {
    code: 'FCO',
    name: 'Leonardo da Vinci International Airport',
    city: 'Rome',
    country: 'Italy',
    timezone: 'Europe/Rome',
    coordinates: {
      latitude: 41.8003,
      longitude: 12.2389
    }
  },
  {
    code: 'MXP',
    name: 'Milan Malpensa Airport',
    city: 'Milan',
    country: 'Italy',
    timezone: 'Europe/Rome',
    coordinates: {
      latitude: 45.6306,
      longitude: 8.7281
    }
  },
  {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    coordinates: {
      latitude: 51.4700,
      longitude: -0.4543
    }
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    timezone: 'Europe/Paris',
    coordinates: {
      latitude: 49.0097,
      longitude: 2.5479
    }
  },
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
    coordinates: {
      latitude: 40.6413,
      longitude: -73.7781
    }
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437
    }
  },
  {
    code: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    coordinates: {
      latitude: 35.7720,
      longitude: 140.3929
    }
  },
  {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    timezone: 'Asia/Dubai',
    coordinates: {
      latitude: 25.2532,
      longitude: 55.3657
    }
  }
];

// Sample users data
const usersData = [
  {
    email: 'admin@taw.com',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin'
  },
  {
    email: 'alitalia@airline.com',
    password: 'alitalia123',
    firstName: 'Alitalia',
    lastName: 'Manager',
    role: 'airline'
  },
  {
    email: 'lufthansa@airline.com',
    password: 'lufthansa123',
    firstName: 'Lufthansa',
    lastName: 'Manager',
    role: 'airline'
  },
  {
    email: 'british@airline.com',
    password: 'british123',
    firstName: 'British Airways',
    lastName: 'Manager',
    role: 'airline'
  },
  {
    email: 'passenger@test.com',
    password: 'passenger123',
    firstName: 'Test',
    lastName: 'Passenger',
    role: 'passenger'
  }
];

// Sample airlines data
const airlinesData = [
  {
    code: 'AZ',
    name: 'Alitalia',
    country: 'Italy',
    website: 'https://www.alitalia.com',
    contactEmail: 'info@alitalia.com',
    contactPhone: '+390665649'
  },
  {
    code: 'LH',
    name: 'Lufthansa',
    country: 'Germany',
    website: 'https://www.lufthansa.com',
    contactEmail: 'service@lufthansa.com',
    contactPhone: '+4969867997'
  },
  {
    code: 'BA',
    name: 'British Airways',
    country: 'United Kingdom',
    website: 'https://www.britishairways.com',
    contactEmail: 'customer.relations@britishairways.com',
    contactPhone: '+443444930787'
  }
];

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Airport.deleteMany({});
    await Airline.deleteMany({});
    
    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${userData.email}`);
    }
    
    // Create airports
    console.log('✈️  Creating airports...');
    for (const airportData of airportsData) {
      const airport = new Airport(airportData);
      await airport.save();
      console.log(`✅ Created airport: ${airportData.code} - ${airportData.name}`);
    }
    
    // Create airlines with user references
    console.log('🏢 Creating airlines...');
    const airlineUsers = createdUsers.filter(user => user.role === 'airline');
    
    for (let i = 0; i < airlinesData.length && i < airlineUsers.length; i++) {
      const airlineData = airlinesData[i];
      const airline = new Airline({
        ...airlineData,
        userId: airlineUsers[i]._id
      });
      await airline.save();
      console.log(`✅ Created airline: ${airlineData.code} - ${airlineData.name}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Airports: ${airportsData.length}`);
    console.log(`   Airlines: ${Math.min(airlinesData.length, airlineUsers.length)}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: admin@taw.com / admin123');
    console.log('   Alitalia: alitalia@airline.com / alitalia123');
    console.log('   Lufthansa: lufthansa@airline.com / lufthansa123');
    console.log('   British Airways: british@airline.com / british123');
    console.log('   Passenger: passenger@test.com / passenger123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
  // Non disconnettere il database qui per mantenere la connessione attiva
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}