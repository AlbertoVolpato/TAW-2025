# Backend Documentation - Flight Booking System

## Panoramica

Il backend è sviluppato con Node.js, Express.js e MongoDB, fornendo un'API RESTful completa per il sistema di prenotazione voli. L'architettura segue i principi REST e implementa pattern di sicurezza moderni.

## Architettura

### Struttura delle Cartelle

```
src/
├── controllers/              # Controller delle API
│   ├── authController.ts     # Autenticazione e autorizzazione
│   ├── userController.ts     # Gestione utenti
│   ├── flightController.ts   # Gestione voli
│   ├── bookingController.ts  # Gestione prenotazioni
│   ├── airportController.ts  # Gestione aeroporti
│   └── airlineController.ts  # Gestione compagnie aeree
├── models/                   # Modelli Mongoose
│   ├── User.ts              # Schema utente
│   ├── Flight.ts            # Schema volo
│   ├── Booking.ts           # Schema prenotazione
│   ├── Airport.ts           # Schema aeroporto
│   ├── Airline.ts           # Schema compagnia aerea
│   └── Aircraft.ts          # Schema aeromobile
├── routes/                   # Definizione routes
│   ├── index.ts             # Route principali
│   ├── auth.ts              # Route autenticazione
│   ├── users.ts             # Route utenti
│   ├── flights.ts           # Route voli
│   ├── bookings.ts          # Route prenotazioni
│   ├── airports.ts          # Route aeroporti
│   └── airlines.ts          # Route compagnie
├── middleware/               # Middleware personalizzati
│   ├── auth.ts              # Autenticazione JWT
│   ├── validation.ts        # Validazione dati
│   ├── errorHandler.ts      # Gestione errori
│   ├── rateLimiter.ts       # Rate limiting
│   └── dbCheck.ts           # Controllo connessione DB
├── config/                   # Configurazioni
│   ├── database.ts          # Configurazione MongoDB
│   ├── jwt.ts               # Configurazione JWT
│   └── cors.ts              # Configurazione CORS
├── utils/                    # Utility functions
│   ├── seedData.ts          # Seeding database
│   ├── validators.ts        # Validatori Joi
│   ├── emailService.ts      # Servizio email
│   └── logger.ts            # Sistema logging
├── types/                    # Definizioni TypeScript
│   ├── express.d.ts         # Estensioni Express
│   └── jwt.d.ts             # Tipi JWT
└── app.ts                    # Configurazione Express
```

## Modelli Database

### User Model
**File**: `models/User.ts`

```typescript
interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'airline' | 'user';
  isActive: boolean;
  emailVerified: boolean;
  airline?: ObjectId; // Solo per ruolo 'airline'
  profile: {
    phone?: string;
    dateOfBirth?: Date;
    nationality?: string;
    passportNumber?: string;
  };
  preferences: {
    seatPreference?: 'window' | 'aisle' | 'middle';
    mealPreference?: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Funzionalità**:
- Hash automatico password con bcrypt
- Validazione email unica
- Metodi per confronto password
- Middleware pre-save per hashing
- Indici per performance

### Flight Model
**File**: `models/Flight.ts`

```typescript
interface IFlight extends Document {
  flightNumber: string;
  airline: ObjectId;
  aircraft: ObjectId;
  route: {
    origin: ObjectId;
    destination: ObjectId;
    distance: number;
  };
  schedule: {
    departure: Date;
    arrival: Date;
    duration: number; // in minutes
  };
  pricing: {
    economy: number;
    business?: number;
    first?: number;
  };
  availability: {
    economy: number;
    business?: number;
    first?: number;
  };
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'delayed';
  gate?: string;
  terminal?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking Model
**File**: `models/Booking.ts`

```typescript
interface IBooking extends Document {
  bookingReference: string;
  user: ObjectId;
  flight: ObjectId;
  passengers: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    passportNumber: string;
    nationality: string;
    seatNumber?: string;
    seatClass: 'economy' | 'business' | 'first';
    specialRequests?: string[];
  }[];
  pricing: {
    basePrice: number;
    taxes: number;
    fees: number;
    total: number;
  };
  payment: {
    method: 'credit_card' | 'paypal' | 'bank_transfer';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: Date;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

## Controllers

### AuthController
**File**: `controllers/authController.ts`

#### Endpoints:

**POST /api/auth/register**
```typescript
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Validazione input
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }
    
    // Controllo email esistente
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Creazione utente
    const user = new User({
      email,
      password, // Verrà hashata automaticamente
      firstName,
      lastName,
      role: role || 'user'
    });
    
    await user.save();
    
    // Generazione JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
```

**POST /api/auth/login**
```typescript
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    // Validazione input
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }
    
    // Ricerca utente con password
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verifica password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generazione JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### FlightController
**File**: `controllers/flightController.ts`

#### Ricerca Voli Avanzata
```typescript
export const searchFlights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      class: seatClass,
      maxPrice,
      airline,
      directOnly
    } = req.query;
    
    // Costruzione query MongoDB
    const query: any = {};
    
    // Filtri base
    if (origin) {
      const originAirport = await Airport.findOne({ code: origin });
      if (originAirport) {
        query['route.origin'] = originAirport._id;
      }
    }
    
    if (destination) {
      const destAirport = await Airport.findOne({ code: destination });
      if (destAirport) {
        query['route.destination'] = destAirport._id;
      }
    }
    
    // Filtro data
    if (departureDate) {
      const startDate = new Date(departureDate as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query['schedule.departure'] = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Filtro disponibilità
    const passengerCount = parseInt(passengers as string) || 1;
    const classKey = `availability.${seatClass || 'economy'}`;
    query[classKey] = { $gte: passengerCount };
    
    // Filtro prezzo
    if (maxPrice) {
      const priceKey = `pricing.${seatClass || 'economy'}`;
      query[priceKey] = { $lte: parseInt(maxPrice as string) };
    }
    
    // Filtro compagnia
    if (airline) {
      const airlineDoc = await Airline.findOne({ code: airline });
      if (airlineDoc) {
        query.airline = airlineDoc._id;
      }
    }
    
    // Solo voli attivi
    query.status = { $in: ['scheduled', 'boarding'] };
    
    // Esecuzione query con popolamento
    const flights = await Flight.find(query)
      .populate('airline', 'name code logo')
      .populate('route.origin', 'code name city country')
      .populate('route.destination', 'code name city country')
      .populate('aircraft', 'model manufacturer capacity')
      .sort({ 'schedule.departure': 1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      data: {
        flights,
        count: flights.length,
        searchCriteria: {
          origin,
          destination,
          departureDate,
          passengers: passengerCount,
          class: seatClass || 'economy'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### BookingController
**File**: `controllers/bookingController.ts`

#### Creazione Prenotazione
```typescript
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { flightId, passengers, seatClass, paymentMethod } = req.body;
    
    // Validazione input
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }
    
    // Verifica volo esistente
    const flight = await Flight.findById(flightId)
      .populate('airline', 'name')
      .populate('route.origin route.destination', 'code name city');
    
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }
    
    // Verifica disponibilità
    const availabilityKey = `availability.${seatClass}`;
    const currentAvailability = flight[availabilityKey as keyof typeof flight] as number;
    
    if (currentAvailability < passengers.length) {
      return res.status(409).json({
        success: false,
        message: 'Not enough seats available'
      });
    }
    
    // Calcolo prezzo
    const priceKey = `pricing.${seatClass}`;
    const basePrice = flight[priceKey as keyof typeof flight] as number;
    const totalBasePrice = basePrice * passengers.length;
    const taxes = totalBasePrice * 0.15; // 15% tasse
    const fees = 25 * passengers.length; // €25 fee per passeggero
    const total = totalBasePrice + taxes + fees;
    
    // Generazione reference unico
    const bookingReference = generateBookingReference();
    
    // Creazione prenotazione
    const booking = new Booking({
      bookingReference,
      user: userId,
      flight: flightId,
      passengers: passengers.map((p: any) => ({
        ...p,
        seatClass
      })),
      pricing: {
        basePrice: totalBasePrice,
        taxes,
        fees,
        total
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      status: 'pending'
    });
    
    // Transazione per aggiornare disponibilità
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await booking.save({ session });
      
      // Aggiorna disponibilità volo
      await Flight.findByIdAndUpdate(
        flightId,
        { $inc: { [availabilityKey]: -passengers.length } },
        { session }
      );
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    
    // Popolamento per risposta
    await booking.populate([
      { path: 'flight', populate: {
        path: 'airline route.origin route.destination',
        select: 'name code city'
      }}
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};
```

## Middleware

### Authentication Middleware
**File**: `middleware/auth.ts`

```typescript
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
      
      // Verifica utente attivo
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      // Aggiunge info utente alla request
      (req as any).user = {
        userId: decoded.userId,
        role: user.role
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};
```

### Error Handler Middleware
**File**: `middleware/errorHandler.ts`

```typescript
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log errore
  console.error(err);
  
  // Errori Mongoose
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }
  
  // Errori duplicati Mongoose
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }
  
  // Errori validazione Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Rate Limiting
**File**: `middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter generale
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter per autenticazione
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 tentativi di login
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true
});

// Rate limiter per ricerca
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 ricerche per minuto
  message: {
    success: false,
    message: 'Too many search requests, please slow down'
  }
});
```

## Validazione Dati

### Joi Schemas
**File**: `utils/validators.ts`

```typescript
import Joi from 'joi';

// Schema registrazione
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  role: Joi.string().valid('admin', 'airline', 'user').default('user')
});

// Schema login
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Schema creazione volo
export const createFlightSchema = Joi.object({
  flightNumber: Joi.string().pattern(/^[A-Z]{2}\d{3,4}$/).required().messages({
    'string.pattern.base': 'Flight number must be in format XX123 or XX1234'
  }),
  airline: Joi.string().hex().length(24).required(),
  aircraft: Joi.string().hex().length(24).required(),
  route: Joi.object({
    origin: Joi.string().hex().length(24).required(),
    destination: Joi.string().hex().length(24).required()
  }).required(),
  schedule: Joi.object({
    departure: Joi.date().iso().min('now').required(),
    arrival: Joi.date().iso().greater(Joi.ref('departure')).required()
  }).required(),
  pricing: Joi.object({
    economy: Joi.number().positive().required(),
    business: Joi.number().positive(),
    first: Joi.number().positive()
  }).required()
});

// Schema prenotazione
export const createBookingSchema = Joi.object({
  flightId: Joi.string().hex().length(24).required(),
  passengers: Joi.array().items(
    Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      dateOfBirth: Joi.date().max('now').required(),
      passportNumber: Joi.string().min(6).max(20).required(),
      nationality: Joi.string().length(2).uppercase().required()
    })
  ).min(1).max(9).required(),
  seatClass: Joi.string().valid('economy', 'business', 'first').default('economy'),
  paymentMethod: Joi.string().valid('credit_card', 'paypal', 'bank_transfer').required()
});
```

## Database Configuration

### MongoDB Connection
**File**: `config/database.ts`

```typescript
import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flightbooking';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };
    
    await mongoose.connect(mongoUri, options);
    
    console.log('✅ MongoDB connected successfully');
    
    // Event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};
```

## Seeding Database

### Script di Seeding
**File**: `utils/seedData.ts`

```typescript
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Airport } from '../models/Airport';
import { Airline } from '../models/Airline';
import { Aircraft } from '../models/Aircraft';
import { Flight } from '../models/Flight';

const seedUsers = async () => {
  const users = [
    {
      email: 'admin@flightbooking.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true
    },
    {
      email: 'airline@alitalia.com',
      password: 'airline123',
      firstName: 'Airline',
      lastName: 'Manager',
      role: 'airline',
      isActive: true,
      emailVerified: true
    },
    {
      email: 'user@example.com',
      password: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      isActive: true,
      emailVerified: true
    }
  ];
  
  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }
  }
};

const seedAirports = async () => {
  const airports = [
    {
      code: 'FCO',
      name: 'Leonardo da Vinci International Airport',
      city: 'Rome',
      country: 'Italy',
      timezone: 'Europe/Rome',
      coordinates: { latitude: 41.8003, longitude: 12.2389 }
    },
    {
      code: 'MXP',
      name: 'Milan Malpensa Airport',
      city: 'Milan',
      country: 'Italy',
      timezone: 'Europe/Rome',
      coordinates: { latitude: 45.6306, longitude: 8.7281 }
    },
    {
      code: 'LHR',
      name: 'London Heathrow Airport',
      city: 'London',
      country: 'United Kingdom',
      timezone: 'Europe/London',
      coordinates: { latitude: 51.4700, longitude: -0.4543 }
    }
  ];
  
  for (const airportData of airports) {
    const existingAirport = await Airport.findOne({ code: airportData.code });
    if (!existingAirport) {
      const airport = new Airport(airportData);
      await airport.save();
      console.log(`✅ Created airport: ${airportData.code}`);
    }
  }
};

const seedAirlines = async () => {
  const airlines = [
    {
      code: 'AZ',
      name: 'Alitalia',
      country: 'Italy',
      logo: 'https://example.com/alitalia-logo.png',
      isActive: true
    },
    {
      code: 'BA',
      name: 'British Airways',
      country: 'United Kingdom',
      logo: 'https://example.com/ba-logo.png',
      isActive: true
    },
    {
      code: 'AF',
      name: 'Air France',
      country: 'France',
      logo: 'https://example.com/af-logo.png',
      isActive: true
    }
  ];
  
  for (const airlineData of airlines) {
    const existingAirline = await Airline.findOne({ code: airlineData.code });
    if (!existingAirline) {
      const airline = new Airline(airlineData);
      await airline.save();
      console.log(`✅ Created airline: ${airlineData.code}`);
    }
  }
};

const seedFlights = async () => {
  // Ottieni riferimenti
  const alitalia = await Airline.findOne({ code: 'AZ' });
  const fco = await Airport.findOne({ code: 'FCO' });
  const mxp = await Airport.findOne({ code: 'MXP' });
  
  if (!alitalia || !fco || !mxp) {
    console.log('❌ Missing required data for flights');
    return;
  }
  
  const flights = [
    {
      flightNumber: 'AZ123',
      airline: alitalia._id,
      route: {
        origin: fco._id,
        destination: mxp._id,
        distance: 477
      },
      schedule: {
        departure: new Date('2024-12-25T08:00:00Z'),
        arrival: new Date('2024-12-25T09:30:00Z'),
        duration: 90
      },
      pricing: {
        economy: 150,
        business: 350
      },
      availability: {
        economy: 120,
        business: 20
      },
      status: 'scheduled'
    }
  ];
  
  for (const flightData of flights) {
    const existingFlight = await Flight.findOne({ flightNumber: flightData.flightNumber });
    if (!existingFlight) {
      const flight = new Flight(flightData);
      await flight.save();
      console.log(`✅ Created flight: ${flightData.flightNumber}`);
    }
  }
};

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDatabase();
    
    await seedUsers();
    await seedAirports();
    await seedAirlines();
    await seedFlights();
    
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await disconnectDatabase();
  }
};

// Esegui seeding se chiamato direttamente
if (require.main === module) {
  seedDatabase();
}
```

## API Documentation

### Response Format
Tutte le API seguono un formato di risposta consistente:

```typescript
// Successo
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Dati specifici dell'endpoint
  }
}

// Errore
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Opzionale
}
```

### Status Codes
- **200**: OK - Richiesta completata con successo
- **201**: Created - Risorsa creata con successo
- **400**: Bad Request - Errore di validazione o richiesta malformata
- **401**: Unauthorized - Autenticazione richiesta o token non valido
- **403**: Forbidden - Permessi insufficienti
- **404**: Not Found - Risorsa non trovata
- **409**: Conflict - Conflitto (es. email già esistente)
- **422**: Unprocessable Entity - Errore di validazione semantica
- **429**: Too Many Requests - Rate limit superato
- **500**: Internal Server Error - Errore interno del server

## Security Best Practices

### 1. Autenticazione JWT
- Token con scadenza configurabile
- Refresh token per sessioni lunghe
- Blacklist per token revocati
- Algoritmo HS256 sicuro

### 2. Password Security
- Hash con bcrypt e salt
- Requisiti di complessità
- Protezione contro brute force
- Rate limiting su login

### 3. Input Validation
- Validazione Joi su tutti gli input
- Sanitizzazione dati
- Protezione XSS
- Validazione tipi MongoDB ObjectId

### 4. Rate Limiting
- Limiti differenziati per endpoint
- Protezione contro DDoS
- Whitelist per IP fidati
- Logging tentativi sospetti

### 5. CORS Configuration
```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## Performance Optimization

### 1. Database Indexing
```typescript
// User model indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Flight model indexes
flightSchema.index({ 'route.origin': 1, 'route.destination': 1 });
flightSchema.index({ 'schedule.departure': 1 });
flightSchema.index({ airline: 1 });
flightSchema.index({ status: 1 });
flightSchema.index({ flightNumber: 1 }, { unique: true });

// Booking model indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ bookingReference: 1 }, { unique: true });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
```

### 2. Query Optimization
```typescript
// Proiezione campi necessari
const flights = await Flight.find(query)
  .select('flightNumber route schedule pricing availability status')
  .populate('airline', 'name code logo')
  .lean(); // Restituisce oggetti JS plain per performance

// Aggregation per statistiche
const stats = await Booking.aggregate([
  { $match: { status: 'confirmed' } },
  { $group: {
    _id: '$flight',
    totalBookings: { $sum: 1 },
    totalRevenue: { $sum: '$pricing.total' }
  }}
]);
```

### 3. Caching Strategy
```typescript
// Redis per cache frequenti
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache risultati ricerca
export const getCachedFlights = async (searchKey: string) => {
  const cached = await redis.get(`flights:${searchKey}`);
  return cached ? JSON.parse(cached) : null;
};

export const setCachedFlights = async (searchKey: string, flights: any[]) => {
  await redis.setex(`flights:${searchKey}`, 300, JSON.stringify(flights)); // 5 min cache
};
```

## Testing

### Unit Testing
```typescript
// __tests__/controllers/auth.test.ts
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });
    
    it('should not register user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/booking.test.ts
describe('Booking Integration', () => {
  let authToken: string;
  let userId: string;
  let flightId: string;
  
  beforeAll(async () => {
    // Setup test data
    const user = await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User'
    });
    
    userId = user._id.toString();
    authToken = jwt.sign({ userId, role: 'user' }, process.env.JWT_SECRET!);
    
    // Create test flight
    const flight = await Flight.create({
      flightNumber: 'TEST123',
      // ... other flight data
    });
    
    flightId = flight._id.toString();
  });
  
  it('should create booking successfully', async () => {
    const bookingData = {
      flightId,
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        passportNumber: 'AB123456',
        nationality: 'IT'
      }],
      seatClass: 'economy',
      paymentMethod: 'credit_card'
    };
    
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookingData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.booking.bookingReference).toBeDefined();
  });
});
```

## Deployment

### Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/flightbooking
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://localhost:6379
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

### Health Check
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

## Monitoring e Logging

### Winston Logger
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### Request Logging
```typescript
import morgan from 'morgan';

// Custom morgan format
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));
```

## Troubleshooting

### Problemi Comuni

1. **Errori di Connessione MongoDB**
   - Verificare URI di connessione
   - Controllare firewall e network
   - Verificare credenziali

2. **Errori JWT**
   - Verificare JWT_SECRET
   - Controllare scadenza token
   - Validare formato Authorization header

3. **Performance Issues**
   - Verificare indici database
   - Monitorare query lente
   - Controllare memory leaks

4. **Rate Limiting**
   - Configurare whitelist IP
   - Adjustare limiti per ambiente
   - Implementare bypass per testing

### Debug Commands
```bash
# Logs in tempo reale
tail -f logs/combined.log

# Connessione MongoDB
mongo mongodb://localhost:27017/flightbooking

# Performance monitoring
npm run monitor

# Health check
curl http://localhost:3000/health
```