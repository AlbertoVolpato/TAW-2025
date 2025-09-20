import { User } from "../models/User";
import { Airline } from "../models/Airline";
import { Airport } from "../models/Airport";
import { Flight } from "../models/Flight";
import { Route } from "../models/Route";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Store credentials during initialization
let credentialsData: string[] = [];

export async function initializeDatabase(): Promise<void> {
  console.log("🔄 Initializing database with test data...");
  credentialsData = []; // Reset credentials

  try {
    await createAdminUser();
    await createTestAirlines();
    await createTestAirports();
    await createTestUsers();
    await createTestRoutes();
    await createTestFlights();

    // Generate credentials file
    await generateCredentialsFile();

    console.log("✅ Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    throw error;
  }
}

async function createAdminUser(): Promise<void> {
  // Create admin user if it doesn't exist
  const adminExists = await User.findOne({ role: "admin" });

  if (!adminExists) {
    const adminPassword = "admin123";
    const admin = new User({
      email: "admin@tawairline.com",
      password: adminPassword, // Will be hashed by the pre-save hook
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: false,
    });

    await admin.save();
    console.log("👨‍💼 Created admin user: admin@tawairline.com / admin123");

    // Save credentials
    credentialsData.push("AMMINISTRATORE:");
    credentialsData.push(`Email: admin@tawairline.com`);
    credentialsData.push(`Password: ${adminPassword}`);
    credentialsData.push(`Ruolo: Admin`);
    credentialsData.push("");
  } else {
    console.log("👨‍💼 Admin user already exists");
  }
}

async function createTestAirlines(): Promise<void> {
  const airlines = [
    {
      name: "ITA Airways",
      code: "AZ",
      country: "Italy",
      contactEmail: "contact@ita-airways.com",
    },
    {
      name: "Lufthansa",
      code: "LH",
      country: "Germany",
      contactEmail: "contact@lufthansa.com",
    },
    {
      name: "Air France",
      code: "AF",
      country: "France",
      contactEmail: "contact@airfrance.com",
    },
    {
      name: "British Airways",
      code: "BA",
      country: "United Kingdom",
      contactEmail: "contact@britishairways.com",
    },
    {
      name: "KLM Royal Dutch Airlines",
      code: "KL",
      country: "Netherlands",
      contactEmail: "contact@klm.com",
    },
    {
      name: "Iberia",
      code: "IB",
      country: "Spain",
      contactEmail: "contact@iberia.com",
    },
    {
      name: "Swiss International Air Lines",
      code: "LX",
      country: "Switzerland",
      contactEmail: "contact@swiss.com",
    },
    {
      name: "Austrian Airlines",
      code: "OS",
      country: "Austria",
      contactEmail: "contact@austrian.com",
    },
    {
      name: "Brussels Airlines",
      code: "SN",
      country: "Belgium",
      contactEmail: "contact@brusselsairlines.com",
    },
    {
      name: "TAP Air Portugal",
      code: "TP",
      country: "Portugal",
      contactEmail: "contact@tapairportugal.com",
    },
  ];

  for (const airlineData of airlines) {
    const existingAirline = await Airline.findOne({ code: airlineData.code });
    if (!existingAirline) {
      // Create airline user first
      const existingUser = await User.findOne({
        email: airlineData.contactEmail,
      });
      let airlineUser;
      const airlinePassword = "airline123";

      if (!existingUser) {
        airlineUser = new User({
          email: airlineData.contactEmail,
          password: airlinePassword, // Will be hashed by the pre-save hook
          firstName: airlineData.name.split(" ")[0],
          lastName: "Admin",
          role: "airline",
          isActive: true,
          isEmailVerified: true,
          mustChangePassword: false,
        });
        await airlineUser.save();

        // Save credentials
        credentialsData.push(
          `COMPAGNIA AEREA: ${airlineData.name} (${airlineData.code})`
        );
        credentialsData.push(`Email: ${airlineData.contactEmail}`);
        credentialsData.push(`Password: ${airlinePassword}`);
        credentialsData.push(`Ruolo: Airline`);
        credentialsData.push("");
      } else {
        airlineUser = existingUser;
      }

      // Create airline with userId and contactEmail
      const airline = new Airline({
        name: airlineData.name,
        code: airlineData.code,
        country: airlineData.country,
        contactEmail: airlineData.contactEmail,
        userId: airlineUser._id,
        isActive: true,
      });
      await airline.save();
    }
  }
  console.log("✈️ Created test airlines with associated users");
}

async function createTestAirports(): Promise<void> {
  const airports = [
    {
      name: "Leonardo da Vinci International Airport",
      code: "FCO",
      city: "Rome",
      country: "Italy",
      timezone: "Europe/Rome",
      coordinates: { latitude: 41.8003, longitude: 12.2389 },
    },
    {
      name: "Milan Malpensa Airport",
      code: "MXP",
      city: "Milan",
      country: "Italy",
      timezone: "Europe/Rome",
      coordinates: { latitude: 45.6306, longitude: 8.7281 },
    },
    {
      name: "Naples International Airport",
      code: "NAP",
      city: "Naples",
      country: "Italy",
      timezone: "Europe/Rome",
      coordinates: { latitude: 40.886, longitude: 14.2908 },
    },
    {
      name: "Charles de Gaulle Airport",
      code: "CDG",
      city: "Paris",
      country: "France",
      timezone: "Europe/Paris",
      coordinates: { latitude: 49.0097, longitude: 2.5479 },
    },
    {
      name: "London Heathrow Airport",
      code: "LHR",
      city: "London",
      country: "United Kingdom",
      timezone: "Europe/London",
      coordinates: { latitude: 51.47, longitude: -0.4543 },
    },
    {
      name: "Frankfurt Airport",
      code: "FRA",
      city: "Frankfurt",
      country: "Germany",
      timezone: "Europe/Berlin",
      coordinates: { latitude: 50.0379, longitude: 8.5622 },
    },
    {
      name: "Madrid-Barajas Airport",
      code: "MAD",
      city: "Madrid",
      country: "Spain",
      timezone: "Europe/Madrid",
      coordinates: { latitude: 40.4839, longitude: -3.568 },
    },
    {
      name: "Barcelona-El Prat Airport",
      code: "BCN",
      city: "Barcelona",
      country: "Spain",
      timezone: "Europe/Madrid",
      coordinates: { latitude: 41.2974, longitude: 2.0833 },
    },
    {
      name: "Amsterdam Airport Schiphol",
      code: "AMS",
      city: "Amsterdam",
      country: "Netherlands",
      timezone: "Europe/Amsterdam",
      coordinates: { latitude: 52.3105, longitude: 4.7683 },
    },
    {
      name: "Munich Airport",
      code: "MUC",
      city: "Munich",
      country: "Germany",
      timezone: "Europe/Berlin",
      coordinates: { latitude: 48.3537, longitude: 11.775 },
    },
    {
      name: "Zurich Airport",
      code: "ZUR",
      city: "Zurich",
      country: "Switzerland",
      timezone: "Europe/Zurich",
      coordinates: { latitude: 47.4647, longitude: 8.5492 },
    },
    {
      name: "Vienna International Airport",
      code: "VIE",
      city: "Vienna",
      country: "Austria",
      timezone: "Europe/Vienna",
      coordinates: { latitude: 48.1103, longitude: 16.5697 },
    },
    {
      name: "Brussels Airport",
      code: "BRU",
      city: "Brussels",
      country: "Belgium",
      timezone: "Europe/Brussels",
      coordinates: { latitude: 50.9009, longitude: 4.4844 },
    },
  ];

  for (const airportData of airports) {
    const existingAirport = await Airport.findOne({ code: airportData.code });
    if (!existingAirport) {
      const airport = new Airport(airportData);
      await airport.save();
    }
  }
  console.log("🏢 Created test airports");
}

async function createTestUsers(): Promise<void> {
  // Create test airline users
  const airlines = await Airline.find({ isActive: true }).limit(3);

  const testUsers = [
    {
      email: "passenger@example.com",
      password: "password123",
      firstName: "Mario",
      lastName: "Rossi",
      role: "passenger" as const,
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: false,
    },
    {
      email: "passenger2@example.com",
      password: "password123",
      firstName: "Luigi",
      lastName: "Bianchi",
      role: "passenger" as const,
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: false,
    },
  ];

  // Add airline users
  for (let i = 0; i < Math.min(3, airlines.length); i++) {
    const airline = airlines[i];
    testUsers.push({
      email: `airline${i + 1}@${airline.code.toLowerCase()}.com`,
      password: "temppass123",
      firstName: airline.name.split(" ")[0],
      lastName: "Manager",
      role: "airline",
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: true,
      airline: airline._id,
    } as any);
  }

  for (const userData of testUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
    }
  }
  console.log("👥 Created test users (passengers and airline managers)");
}

async function createTestRoutes(): Promise<void> {
  const airports = await Airport.find({ isActive: true });
  const airlines = await Airline.find({ isActive: true });

  if (airports.length < 2 || airlines.length < 1) {
    console.log("⚠️ Insufficient airports or airlines for route creation");
    return;
  }

  const routes = [];
  const popularRoutes = [
    ["FCO", "CDG", 1365, 140], // Rome-Paris
    ["FCO", "LHR", 1435, 150], // Rome-London
    ["FCO", "FRA", 1180, 125], // Rome-Frankfurt
    ["MXP", "CDG", 640, 85], // Milan-Paris
    ["MXP", "LHR", 950, 110], // Milan-London
    ["MXP", "AMS", 850, 100], // Milan-Amsterdam
    ["CDG", "LHR", 460, 75], // Paris-London
    ["CDG", "FRA", 480, 80], // Paris-Frankfurt
    ["CDG", "MAD", 1050, 120], // Paris-Madrid
    ["LHR", "FRA", 650, 90], // London-Frankfurt
    ["LHR", "AMS", 370, 70], // London-Amsterdam
    ["LHR", "MAD", 1270, 135], // London-Madrid
  ];

  let routeCounter = 1;
  const startDate = new Date("2025-09-01");
  const endDate = new Date("2025-10-31");

  for (const [depCode, arrCode, distance, duration] of popularRoutes) {
    const depAirport = airports.find((a) => a.code === depCode);
    const arrAirport = airports.find((a) => a.code === arrCode);

    if (depAirport && arrAirport) {
      // Create routes for multiple airlines on the same route
      for (let i = 0; i < Math.min(3, airlines.length); i++) {
        const airline = airlines[i];
        // Generate routeCode in format XX123 (airline code + counter)
        const routeCode = `${airline.code}${String(routeCounter).padStart(
          3,
          "0"
        )}`;

        const existingRoute = await Route.findOne({ routeCode });

        if (!existingRoute) {
          const route = new Route({
            routeCode,
            airline: airline._id,
            origin: depAirport._id,
            destination: arrAirport._id,
            distance,
            estimatedDuration: duration,
            operatingDays: {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: Math.random() > 0.3, // 70% chance
              sunday: Math.random() > 0.4, // 60% chance
            },
            seasonality: {
              startDate,
              endDate,
            },
            isActive: true,
          });
          routes.push(route);
          routeCounter++;
        }
      }
    }
  }

  if (routes.length > 0) {
    await Route.insertMany(routes);
  }
  console.log(`🛣️ Created ${routes.length} test routes`);
}

// Utility functions for flight generation
function getRandomElement(array: any[]): any {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(base: number, variation = 0.3): number {
  const factor = 1 + (Math.random() - 0.5) * variation;
  return Math.round(base * factor);
}

function generateSeats(capacity: number, basePrice: number) {
  const seats = [];
  const rows = Math.ceil(capacity / 6);

  for (let row = 1; row <= rows; row++) {
    const seatLetters = ["A", "B", "C", "D", "E", "F"];
    for (let i = 0; i < Math.min(6, capacity - (row - 1) * 6); i++) {
      const seatNumber = `${row}${seatLetters[i]}`;
      const isAvailable = Math.random() > 0.3; // 70% available
      const price = getRandomPrice(basePrice, 0.2);

      seats.push({
        seatNumber,
        class: "economy",
        isAvailable,
        price,
      });
    }
  }

  return seats.slice(0, 50); // Limit seats for performance
}

async function createTestFlights(): Promise<void> {
  // Check if flights already exist for Sep-Oct 2025
  const existingFlights = await Flight.find({
    departureTime: {
      $gte: new Date("2025-09-01"),
      $lte: new Date("2025-10-31"),
    },
  }).limit(1);

  if (existingFlights.length > 0) {
    console.log("✈️ Test flights already exist for Sep-Oct 2025");
    return;
  }

  const airports = await Airport.find({ isActive: true });
  const airlines = await Airline.find({ isActive: true });

  if (airports.length < 2 || airlines.length < 1) {
    console.log("⚠️ Insufficient airports or airlines for flight creation");
    return;
  }

  const flights = [];
  let flightCounter = 1000;

  // Aircraft types
  const aircraftTypes = [
    { model: "Airbus A320", capacity: 180 },
    { model: "Airbus A321", capacity: 220 },
    { model: "Boeing 737-800", capacity: 189 },
    { model: "Airbus A350-900", capacity: 325 },
    { model: "Boeing 777-300ER", capacity: 396 },
  ];

  // Popular routes
  const popularRoutes = {
    FCO: ["CDG", "LHR", "FRA", "MAD", "BCN"],
    MXP: ["CDG", "LHR", "AMS", "FRA"],
    CDG: ["FCO", "MXP", "LHR"],
    LHR: ["FCO", "MXP", "CDG"],
  };

  console.log("🛫 Generating test flights for Sep-Oct 2025...");

  // Create airport map
  const airportMap: { [key: string]: any } = {};
  airports.forEach((airport) => {
    airportMap[airport.code] = airport;
  });

  // Generate flights based on popular routes
  for (const originCode of Object.keys(popularRoutes)) {
    const originAirport = airportMap[originCode];
    if (!originAirport) continue;

    const destinations =
      popularRoutes[originCode as keyof typeof popularRoutes];

    for (const destCode of destinations) {
      const destAirport = airportMap[destCode];
      if (!destAirport) continue;

      // Generate flights for this route - ensure daily coverage
      const totalDaysInPeriod = 61; // Sep-Oct 2025
      const minFlightsPerRoute = Math.max(totalDaysInPeriod, 80); // At least 1+ per day
      const maxFlightsPerRoute = totalDaysInPeriod * 2; // Up to 2 per day
      const routeFlights = getRandomNumber(
        minFlightsPerRoute,
        maxFlightsPerRoute
      );

      for (let i = 0; i < routeFlights; i++) {
        const airline = getRandomElement(airlines);
        const aircraft = getRandomElement(aircraftTypes);

        // Better time distribution - spread flights across Sep-Oct 2025
        const startDate = new Date(2025, 8, 1); // September 1st, 2025
        const endDate = new Date(2025, 10, 30); // October 30th, 2025
        const timeDiff = endDate.getTime() - startDate.getTime();
        const randomOffset = Math.random() * timeDiff;
        const randomDate = new Date(startDate.getTime() + randomOffset);

        // Set random time of day
        const hour = getRandomNumber(6, 22);
        const minute = getRandomNumber(0, 3) * 15;

        const departureTime = new Date(
          randomDate.getFullYear(),
          randomDate.getMonth(),
          randomDate.getDate(),
          hour,
          minute
        );
        const durationMinutes = getRandomNumber(90, 360);
        const arrivalTime = new Date(
          departureTime.getTime() + durationMinutes * 60000
        );

        const baseEconomyPrice = getRandomNumber(80, 400);
        const baseBusinessPrice = Math.round(baseEconomyPrice * 3.5);
        const baseFirstPrice = Math.round(baseEconomyPrice * 6);

        const flightNum = (flightCounter % 9000) + 100;
        const flightNumber = `${airline.code}${flightNum}`;
        flightCounter++;

        const seats = generateSeats(aircraft.capacity, baseEconomyPrice);

        const flight = {
          flightNumber,
          airline: airline._id,
          departureAirport: originAirport._id,
          arrivalAirport: destAirport._id,
          departureTime,
          arrivalTime,
          duration: durationMinutes,
          aircraft: {
            model: aircraft.model,
            capacity: aircraft.capacity,
          },
          seats,
          basePrice: {
            economy: baseEconomyPrice,
            business: baseBusinessPrice,
            first: baseFirstPrice,
          },
          status: "scheduled",
          gate: `${getRandomElement(["A", "B", "C", "D"])}${getRandomNumber(
            1,
            30
          )}`,
          terminal: `${getRandomNumber(1, 3)}`,
          baggage: {
            carryOn: {
              maxWeight: 8,
              maxDimensions: "55x40x20 cm",
            },
            checked: {
              included: 1,
              maxWeight: 23,
              extraBagPrice: getRandomNumber(25, 60),
            },
          },
          services: {
            meal: Math.random() > 0.3,
            wifi: Math.random() > 0.4,
            entertainment: Math.random() > 0.2,
            extraLegroom: Math.random() > 0.7,
          },
          isActive: true,
        };

        flights.push(flight);
      }
    }
  }

  // Add specific test flights AZ101 and AZ102
  const fcoAirport = airportMap["FCO"] || airports[0];
  const mxpAirport = airportMap["MXP"] || airports[1];
  const azAirline = airlines.find((a) => a.code === "AZ") || airlines[0];

  if (fcoAirport && mxpAirport && azAirline) {
    const testFlights = [
      {
        flightNumber: "AZ101",
        airline: azAirline._id,
        departureAirport: fcoAirport._id,
        arrivalAirport: mxpAirport._id,
        departureTime: new Date("2025-09-25T08:00:00Z"),
        arrivalTime: new Date("2025-09-25T09:30:00Z"),
        duration: 90,
        aircraft: { model: "Airbus A320", capacity: 180 },
        seats: [
          { seatNumber: "1A", class: "first", isAvailable: true, price: 800 },
          { seatNumber: "1B", class: "first", isAvailable: true, price: 800 },
          {
            seatNumber: "2A",
            class: "business",
            isAvailable: true,
            price: 450,
          },
          {
            seatNumber: "2B",
            class: "business",
            isAvailable: true,
            price: 450,
          },
          {
            seatNumber: "10A",
            class: "economy",
            isAvailable: true,
            price: 150,
          },
          {
            seatNumber: "10B",
            class: "economy",
            isAvailable: true,
            price: 150,
          },
          {
            seatNumber: "10C",
            class: "economy",
            isAvailable: true,
            price: 150,
          },
        ],
        basePrice: { economy: 150, business: 450, first: 800 },
        baggage: {
          carryOn: { maxWeight: 8, maxDimensions: "55x40x20 cm" },
          checked: { included: 1, maxWeight: 23, extraBagPrice: 50 },
        },
        services: {
          meal: true,
          wifi: true,
          entertainment: true,
          extraLegroom: false,
        },
        status: "scheduled",
        isActive: true,
      },
      {
        flightNumber: "AZ102",
        airline: azAirline._id,
        departureAirport: mxpAirport._id,
        arrivalAirport: fcoAirport._id,
        departureTime: new Date("2025-09-25T18:00:00Z"),
        arrivalTime: new Date("2025-09-25T19:30:00Z"),
        duration: 90,
        aircraft: { model: "Airbus A320", capacity: 180 },
        seats: [
          { seatNumber: "1A", class: "first", isAvailable: true, price: 800 },
          { seatNumber: "1B", class: "first", isAvailable: true, price: 800 },
          {
            seatNumber: "2A",
            class: "business",
            isAvailable: true,
            price: 450,
          },
          {
            seatNumber: "2B",
            class: "business",
            isAvailable: true,
            price: 450,
          },
          {
            seatNumber: "10A",
            class: "economy",
            isAvailable: true,
            price: 160,
          },
          {
            seatNumber: "10B",
            class: "economy",
            isAvailable: true,
            price: 160,
          },
          {
            seatNumber: "10C",
            class: "economy",
            isAvailable: true,
            price: 160,
          },
        ],
        basePrice: { economy: 160, business: 450, first: 800 },
        baggage: {
          carryOn: { maxWeight: 8, maxDimensions: "55x40x20 cm" },
          checked: { included: 1, maxWeight: 23, extraBagPrice: 50 },
        },
        services: {
          meal: true,
          wifi: true,
          entertainment: true,
          extraLegroom: false,
        },
        status: "scheduled",
        isActive: true,
      },
    ];

    flights.push(...testFlights);
  }

  // Insert flights in batches
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < flights.length; i += batchSize) {
    const batch = flights.slice(i, i + batchSize);
    await Flight.insertMany(batch);
    inserted += batch.length;
  }

  console.log(`✈️ Created ${inserted} test flights for Sep-Oct 2025`);
}

async function generateCredentialsFile(): Promise<void> {
  const filename = `credentials.txt`;
  const filepath = path.join(process.cwd(), filename);

  const content = [
    "=".repeat(60),
    "TAW AIRLINE MANAGEMENT SYSTEM - CREDENZIALI DI ACCESSO",
    "=".repeat(60),
    "",
    "Generato il: " + new Date().toLocaleString("it-IT"),
    "",
    ...credentialsData,
    "",
    "=".repeat(60),
    "IMPORTANTE:",
    "- Cambiare le password dopo il primo accesso",
    "- Non condividere queste credenziali",
    "- Eliminare questo file dopo aver salvato le credenziali",
    "=".repeat(60),
  ].join("\n");

  fs.writeFileSync(filepath, content, "utf8");
  console.log(`📄 File credenziali generato: ${filename}`);
}
