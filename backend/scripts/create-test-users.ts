import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { Airline } from "../src/models/Airline";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/airline_management";

async function createTestUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Hash password function
    const hashPassword = async (password: string) => {
      return await bcrypt.hash(password, 12);
    };

    // Create Admin
    const adminExists = await User.findOne({ email: "admin@taw.com" });
    if (!adminExists) {
      const adminUser = new User({
        email: "admin@taw.com",
        password: await hashPassword("admin123"),
        firstName: "Admin",
        lastName: "System",
        role: "admin",
        walletBalance: 2000,
      });
      await adminUser.save();
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    // Create Airlines
    const airlines = [
      {
        name: "Alitalia",
        code: "AZ",
        country: "Italy",
        email: "alitalia@taw.com",
        password: "alitalia123",
      },
      {
        name: "Ryanair",
        code: "FR",
        country: "Ireland",
        email: "ryanair@taw.com",
        password: "ryanair123",
      },
      {
        name: "Lufthansa",
        code: "LH",
        country: "Germany",
        email: "lufthansa@taw.com",
        password: "lufthansa123",
      },
      {
        name: "ITA Airways",
        code: "IT",
        country: "Italy",
        email: "ita@taw.com",
        password: "ita123",
      },
    ];

    for (const airlineData of airlines) {
      // Create airline user first
      const airlineUserExists = await User.findOne({
        email: airlineData.email,
      });
      let airlineUser;
      if (!airlineUserExists) {
        airlineUser = new User({
          email: airlineData.email,
          password: await hashPassword(airlineData.password),
          firstName: airlineData.name,
          lastName: "Airlines",
          role: "airline",
          walletBalance: 2000,
        });
        await airlineUser.save();
        console.log(`✅ Airline user ${airlineData.email} created`);
      } else {
        airlineUser = airlineUserExists;
        console.log(`ℹ️ Airline user ${airlineData.email} already exists`);
      }

      // Create airline company with userId reference
      let airline = await Airline.findOne({
        code: airlineData.code,
        name: airlineData.name,
      });
      if (!airline) {
        airline = new Airline({
          name: airlineData.name,
          code: airlineData.code,
          country: airlineData.country,
          contactEmail: airlineData.email,
          userId: airlineUser._id,
        });
        await airline.save();
        console.log(`✅ Airline ${airlineData.name} created`);

        // Update user with airline reference
        airlineUser.airline = airline._id;
        await airlineUser.save();
      } else {
        console.log(`ℹ️ Airline ${airlineData.name} already exists`);
      }
    }

    // Create test passengers
    const passengers = [
      {
        email: "passeggero1@test.com",
        password: "test123",
        firstName: "Mario",
        lastName: "Rossi",
      },
      {
        email: "passeggero2@test.com",
        password: "test123",
        firstName: "Anna",
        lastName: "Bianchi",
      },
      {
        email: "passeggero3@test.com",
        password: "test123",
        firstName: "Giuseppe",
        lastName: "Verdi",
      },
    ];

    for (const passengerData of passengers) {
      const passengerExists = await User.findOne({
        email: passengerData.email,
      });
      if (!passengerExists) {
        const passenger = new User({
          email: passengerData.email,
          password: await hashPassword(passengerData.password),
          firstName: passengerData.firstName,
          lastName: passengerData.lastName,
          role: "passenger",
          walletBalance: 2000,
        });
        await passenger.save();
        console.log(`✅ Passenger ${passengerData.email} created`);
      } else {
        console.log(`ℹ️ Passenger ${passengerData.email} already exists`);
      }
    }

    console.log("\n🎉 Test users setup completed!");
    console.log("\n📋 Available credentials:");
    console.log("Admin: admin@taw.com / admin123");
    console.log(
      "Airlines: alitalia@taw.com / alitalia123, ryanair@taw.com / ryanair123, etc."
    );
    console.log("Passengers: passeggero1@test.com / test123, etc.");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUsers();
