# Backend API Documentation
## TAW 2025 - Flight Booking System API

---

## 1. ARCHITETTURA BACKEND

### 1.1 Stack Tecnologico
- **Runtime**: Node.js 20+ con TypeScript
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 7.0 con Mongoose ODM
- **Autenticazione**: JWT (jsonwebtoken)
- **Validazione**: Joi per schema validation
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcrypt con salt rounds 12

### 1.2 Struttura Progetto
```
backend/
├── src/
│   ├── app.ts                  # Express app configuration
│   ├── bin/www.ts             # Server startup
│   ├── config/
│   │   └── database.ts        # MongoDB connection
│   ├── controllers/           # Request handlers
│   │   ├── authController.ts
│   │   ├── flightController.ts
│   │   ├── bookingController.ts
│   │   ├── userController.ts
│   │   └── adminController.ts
│   ├── middleware/            # Custom middleware
│   │   ├── auth.ts           # JWT authentication
│   │   └── validation.ts     # Request validation
│   ├── models/               # Mongoose models
│   │   ├── User.ts
│   │   ├── Flight.ts
│   │   ├── Booking.ts
│   │   ├── Airline.ts
│   │   └── Airport.ts
│   ├── routes/               # Express routes
│   │   ├── auth.ts
│   │   ├── flights.ts
│   │   ├── bookings.ts
│   │   └── admin.ts
│   ├── services/             # Business logic
│   │   └── emailService.ts
│   └── utils/               # Utility functions
│       └── helpers.ts
├── scripts/                 # Database scripts
│   ├── seedData.ts
│   └── initialize.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 2. MODELLI DATI (Mongoose Schemas)

### 2.1 User Model
```typescript
// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'airline' | 'passenger';
  firstName: string;
  lastName: string;
  isActive: boolean;
  dateOfBirth?: Date;
  phoneNumber?: string;
  airlineId?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'airline', 'passenger'],
    default: 'passenger'
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dateOfBirth: {
    type: Date,
    required: function() { return this.role === 'passenger'; }
  },
  phoneNumber: {
    type: String,
    match: /^\+?[1-9]\d{1,14}$/
  },
  airlineId: {
    type: Schema.Types.ObjectId,
    ref: 'Airline',
    required: function() { return this.role === 'airline'; }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model<IUser>('User', userSchema);
```

### 2.2 Flight Model
```typescript
// src/models/Flight.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IFlight extends Document {
  flightNumber: string;
  airlineId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  aircraftId: mongoose.Types.ObjectId;
  departureAirportId: mongoose.Types.ObjectId;
  arrivalAirportId: mongoose.Types.ObjectId;
  departureTime: Date;
  arrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  basePrice: number;
  availableSeats: number;
  totalSeats: number;
}

const flightSchema = new Schema<IFlight>({
  flightNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z]{2}[0-9]{1,4}$/
  },
  airlineId: {
    type: Schema.Types.ObjectId,
    ref: 'Airline',
    required: true
  },
  routeId: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  aircraftId: {
    type: Schema.Types.ObjectId,
    ref: 'Aircraft',
    required: true
  },
  departureAirportId: {
    type: Schema.Types.ObjectId,
    ref: 'Airport',
    required: true
  },
  arrivalAirportId: {
    type: Schema.Types.ObjectId,
    ref: 'Airport',
    required: true
  },
  departureTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Departure time must be in the future'
    }
  },
  arrivalTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        return value > this.departureTime;
      },
      message: 'Arrival time must be after departure time'
    }
  },
  actualDepartureTime: Date,
  actualArrivalTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0.01,
    max: 10000
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
    max: 850
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
flightSchema.index({ 
  departureAirportId: 1, 
  arrivalAirportId: 1, 
  departureTime: 1 
});
flightSchema.index({ airlineId: 1, departureTime: 1 });
flightSchema.index({ status: 1, departureTime: 1 });

export default mongoose.model<IFlight>('Flight', flightSchema);
```

### 2.3 Booking Model
```typescript
// src/models/Booking.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IBooking extends Document {
  bookingReference: string;
  userId: mongoose.Types.ObjectId;
  flightId: mongoose.Types.ObjectId;
  passengerDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    documentNumber: string;
    email: string;
    phoneNumber: string;
  };
  seatNumber?: string;
  ticketPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  generateBookingReference(): string;
}

const bookingSchema = new Schema<IBooking>({
  bookingReference: {
    type: String,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flightId: {
    type: Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  passengerDetails: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function(value: Date) {
          const age = (Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          return age >= 0 && age <= 120;
        },
        message: 'Invalid date of birth'
      }
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 20
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^\+?[1-9]\d{1,14}$/
    }
  },
  seatNumber: {
    type: String,
    match: /^[1-9][0-9]?[A-F]$/
  },
  ticketPrice: {
    type: Number,
    required: true,
    min: 0.01
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: String
}, {
  timestamps: true
});

// Generate booking reference before save
bookingSchema.pre('save', async function(next) {
  if (!this.bookingReference) {
    this.bookingReference = this.generateBookingReference();
  }
  next();
});

bookingSchema.methods.generateBookingReference = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Indexes
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ flightId: 1 });
bookingSchema.index({ bookingReference: 1 }, { unique: true });

export default mongoose.model<IBooking>('Booking', bookingSchema);
```

---

## 3. CONTROLLERS E BUSINESS LOGIC

### 3.1 Authentication Controller
```typescript
// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validationResult } from 'express-validator';

export class AuthController {
  // User registration
  static async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { username, email, password, firstName, lastName, role, dateOfBirth } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or username'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        dateOfBirth: role === 'passenger' ? new Date(dateOfBirth) : undefined
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = AuthController.generateTokens(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // User login
  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = AuthController.generateTokens(user);

      res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.headers.authorization?.split(' ')[1];
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      const { accessToken } = AuthController.generateTokens(user);

      res.json({
        success: true,
        token: accessToken
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Generate JWT tokens
  private static generateTokens(user: any) {
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}
```

### 3.2 Flight Controller
```typescript
// src/controllers/flightController.ts
import { Request, Response } from 'express';
import Flight from '../models/Flight';
import { validationResult } from 'express-validator';

export class FlightController {
  // Search flights
  static async searchFlights(req: Request, res: Response) {
    try {
      const {
        departure,
        arrival,
        departureDate,
        passengers = 1,
        page = 1,
        limit = 10
      } = req.query;

      // Build query
      const query: any = {
        status: 'scheduled',
        availableSeats: { $gte: passengers }
      };

      // Add airport filters if provided
      if (departure) {
        const departureAirport = await Airport.findOne({ code: departure });
        if (departureAirport) {
          query.departureAirportId = departureAirport._id;
        }
      }

      if (arrival) {
        const arrivalAirport = await Airport.findOne({ code: arrival });
        if (arrivalAirport) {
          query.arrivalAirportId = arrivalAirport._id;
        }
      }

      // Add date filter
      if (departureDate) {
        const startDate = new Date(departureDate as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query.departureTime = {
          $gte: startDate,
          $lt: endDate
        };
      }

      // Execute query with pagination
      const flights = await Flight.find(query)
        .populate('airlineId', 'name code')
        .populate('departureAirportId', 'name code city country')
        .populate('arrivalAirportId', 'name code city country')
        .populate('aircraftId', 'model manufacturer capacity')
        .sort({ departureTime: 1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const totalFlights = await Flight.countDocuments(query);

      // Calculate flight duration
      const enrichedFlights = flights.map(flight => ({
        ...flight,
        duration: Math.round((flight.arrivalTime.getTime() - flight.departureTime.getTime()) / (1000 * 60))
      }));

      res.json({
        success: true,
        flights: enrichedFlights,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalFlights / Number(limit)),
          totalFlights,
          hasNextPage: Number(page) < Math.ceil(totalFlights / Number(limit)),
          hasPrevPage: Number(page) > 1
        }
      });

    } catch (error) {
      console.error('Flight search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get flight details
  static async getFlightDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const flight = await Flight.findById(id)
        .populate('airlineId', 'name code country')
        .populate('departureAirportId', 'name code city country timezone')
        .populate('arrivalAirportId', 'name code city country timezone')
        .populate('aircraftId', 'model manufacturer capacity range')
        .populate('routeId', 'distance estimatedDuration');

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: 'Flight not found'
        });
      }

      // Calculate additional flight info
      const duration = Math.round((flight.arrivalTime.getTime() - flight.departureTime.getTime()) / (1000 * 60));
      const occupancyRate = ((flight.totalSeats - flight.availableSeats) / flight.totalSeats * 100).toFixed(1);

      res.json({
        success: true,
        flight: {
          ...flight.toObject(),
          duration,
          occupancyRate: `${occupancyRate}%`
        }
      });

    } catch (error) {
      console.error('Get flight details error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create flight (airline only)
  static async createFlight(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        flightNumber,
        routeId,
        aircraftId,
        departureTime,
        arrivalTime,
        basePrice
      } = req.body;

      // Get aircraft capacity
      const aircraft = await Aircraft.findById(aircraftId);
      if (!aircraft) {
        return res.status(404).json({
          success: false,
          message: 'Aircraft not found'
        });
      }

      // Get route details
      const route = await Route.findById(routeId);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Create flight
      const flight = new Flight({
        flightNumber,
        airlineId: req.user.airlineId,
        routeId,
        aircraftId,
        departureAirportId: route.departureAirportId,
        arrivalAirportId: route.arrivalAirportId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        basePrice,
        availableSeats: aircraft.capacity,
        totalSeats: aircraft.capacity
      });

      await flight.save();

      const populatedFlight = await Flight.findById(flight._id)
        .populate('airlineId', 'name code')
        .populate('departureAirportId', 'name code city')
        .populate('arrivalAirportId', 'name code city')
        .populate('aircraftId', 'model capacity');

      res.status(201).json({
        success: true,
        message: 'Flight created successfully',
        flight: populatedFlight
      });

    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Flight number already exists'
        });
      }

      console.error('Create flight error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
```

---

## 4. MIDDLEWARE E VALIDAZIONE

### 4.1 Authentication Middleware
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
    airlineId?: string;
  };
}

// JWT Authentication middleware
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = decoded;
    next();
  });
};

// Role-based authorization middleware
export const authorize = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges'
      });
    }

    next();
  };
};

// Airline ownership middleware
export const checkAirlineOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role === 'admin') {
      return next(); // Admins can access all airlines
    }

    if (req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Only airline users can perform this action'
      });
    }

    const airlineId = req.params.airlineId || req.body.airlineId;
    if (airlineId && airlineId !== req.user.airlineId) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage your own airline resources'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};
```

### 4.2 Validation Schemas
```typescript
// src/middleware/validation.ts
import { body, param, query } from 'express-validator';

export const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .trim(),
  
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .trim(),
  
  body('role')
    .isIn(['passenger', 'airline'])
    .withMessage('Role must be either passenger or airline'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth is required for passengers')
    .custom((value, { req }) => {
      if (req.body.role === 'passenger' && !value) {
        throw new Error('Date of birth is required for passengers');
      }
      if (value) {
        const age = (Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (age < 0 || age > 120) {
          throw new Error('Invalid date of birth');
        }
      }
      return true;
    })
];

export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateFlightSearch = [
  query('departure')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Departure airport code must be 3 characters')
    .toUpperCase(),
  
  query('arrival')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Arrival airport code must be 3 characters')
    .toUpperCase(),
  
  query('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Valid departure date is required (YYYY-MM-DD format)')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('Departure date cannot be in the past');
      }
      return true;
    }),
  
  query('passengers')
    .optional()
    .isInt({ min: 1, max: 9 })
    .withMessage('Number of passengers must be between 1 and 9'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateFlightCreation = [
  body('flightNumber')
    .matches(/^[A-Z]{2}[0-9]{1,4}$/)
    .withMessage('Flight number must be in format AA123 (2 letters followed by 1-4 digits)')
    .toUpperCase(),
  
  body('routeId')
    .isMongoId()
    .withMessage('Valid route ID is required'),
  
  body('aircraftId')
    .isMongoId()
    .withMessage('Valid aircraft ID is required'),
  
  body('departureTime')
    .isISO8601()
    .withMessage('Valid departure time is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),
  
  body('arrivalTime')
    .isISO8601()
    .withMessage('Valid arrival time is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.departureTime)) {
        throw new Error('Arrival time must be after departure time');
      }
      return true;
    }),
  
  body('basePrice')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Base price must be between 0.01 and 10000')
];

export const validateBookingCreation = [
  body('flightId')
    .isMongoId()
    .withMessage('Valid flight ID is required'),
  
  body('passengerDetails.firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Passenger first name is required and must be less than 50 characters')
    .trim(),
  
  body('passengerDetails.lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Passenger last name is required and must be less than 50 characters')
    .trim(),
  
  body('passengerDetails.dateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required')
    .custom((value) => {
      const age = (Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 0 || age > 120) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),
  
  body('passengerDetails.documentNumber')
    .isLength({ min: 5, max: 20 })
    .withMessage('Document number must be between 5 and 20 characters')
    .trim(),
  
  body('passengerDetails.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('passengerDetails.phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  
  body('seatNumber')
    .optional()
    .matches(/^[1-9][0-9]?[A-F]$/)
    .withMessage('Seat number must be in format like 12A')
];
```

---

## 5. ROUTE DEFINITIONS

### 5.1 Authentication Routes
```typescript
// src/routes/auth.ts
import express from 'express';
import { AuthController } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middleware/validation';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', validateRegistration, AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Private (requires refresh token)
 */
router.post('/refresh', AuthController.refreshToken);

export default router;
```

### 5.2 Flight Routes
```typescript
// src/routes/flights.ts
import express from 'express';
import { FlightController } from '../controllers/flightController';
import { authenticateToken, authorize } from '../middleware/auth';
import { validateFlightSearch, validateFlightCreation } from '../middleware/validation';

const router = express.Router();

/**
 * @route GET /api/flights/search
 * @desc Search available flights
 * @access Public
 */
router.get('/search', validateFlightSearch, FlightController.searchFlights);

/**
 * @route GET /api/flights/:id
 * @desc Get flight details by ID
 * @access Public
 */
router.get('/:id', FlightController.getFlightDetails);

/**
 * @route POST /api/flights
 * @desc Create new flight
 * @access Private (airline only)
 */
router.post('/', 
  authenticateToken, 
  authorize(['airline']), 
  validateFlightCreation, 
  FlightController.createFlight
);

/**
 * @route PUT /api/flights/:id
 * @desc Update flight details
 * @access Private (airline owner only)
 */
router.put('/:id',
  authenticateToken,
  authorize(['airline']),
  validateFlightCreation,
  FlightController.updateFlight
);

/**
 * @route DELETE /api/flights/:id
 * @desc Cancel flight
 * @access Private (airline owner only)
 */
router.delete('/:id',
  authenticateToken,
  authorize(['airline']),
  FlightController.cancelFlight
);

export default router;
```

---

## 6. ERROR HANDLING E LOGGING

### 6.1 Global Error Handler
```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const globalErrorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### 6.2 Request Logging Middleware
```typescript
// src/middleware/logger.ts
import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
```

---

## 7. DATABASE CONFIGURATION E SEEDING

### 7.1 Database Connection
```typescript
// src/config/database.ts
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taw2025';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0 // Disable mongoose buffering
    });

    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### 7.2 Database Seeding Script
```typescript
// scripts/seedData.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import Airline from '../src/models/Airline';
import Airport from '../src/models/Airport';
import Aircraft from '../src/models/Aircraft';

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taw2025');
    
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Airline.deleteMany({}),
      Airport.deleteMany({}),
      Aircraft.deleteMany({})
    ]);

    // Seed admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      username: 'admin',
      email: 'admin@taw2025.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin'
    });

    // Seed airlines
    const airlines = await Airline.insertMany([
      {
        name: 'Alitalia',
        code: 'AZ',
        country: 'Italy',
        isActive: true,
        isVerified: true,
        contactEmail: 'info@alitalia.com',
        website: 'https://www.alitalia.com'
      },
      {
        name: 'Lufthansa',
        code: 'LH',
        country: 'Germany',
        isActive: true,
        isVerified: true,
        contactEmail: 'info@lufthansa.com',
        website: 'https://www.lufthansa.com'
      }
    ]);

    // Seed airline users
    for (const airline of airlines) {
      const airlinePassword = await bcrypt.hash('airline123', 12);
      await User.create({
        username: airline.code.toLowerCase(),
        email: `admin@${airline.code.toLowerCase()}.com`,
        password: airlinePassword,
        firstName: airline.name,
        lastName: 'Admin',
        role: 'airline',
        airlineId: airline._id
      });
    }

    // Seed airports
    await Airport.insertMany([
      {
        name: 'Milano Malpensa',
        code: 'MXP',
        city: 'Milano',
        country: 'Italy',
        timezone: 'Europe/Rome',
        coordinates: { latitude: 45.6306, longitude: 8.7281 }
      },
      {
        name: 'Roma Fiumicino',
        code: 'FCO',
        city: 'Roma',
        country: 'Italy',
        timezone: 'Europe/Rome',
        coordinates: { latitude: 41.8003, longitude: 12.2389 }
      },
      {
        name: 'Frankfurt am Main',
        code: 'FRA',
        city: 'Frankfurt',
        country: 'Germany',
        timezone: 'Europe/Berlin',
        coordinates: { latitude: 50.0264, longitude: 8.5431 }
      }
    ]);

    // Seed aircraft
    await Aircraft.insertMany([
      {
        model: 'Airbus A320',
        manufacturer: 'Airbus',
        capacity: 180,
        range: 6150
      },
      {
        model: 'Boeing 737-800',
        manufacturer: 'Boeing',
        capacity: 189,
        range: 5765
      },
      {
        model: 'Airbus A330-300',
        manufacturer: 'Airbus',
        capacity: 300,
        range: 11750
      }
    ]);

    console.log('Database seeded successfully');
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
```

---

## 8. SECURITY MEASURES

### 8.1 Security Middleware Setup
```typescript
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  }
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});
app.use('/api/auth/', authLimiter);
```

### 8.2 Input Sanitization
```typescript
// src/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
};
```

---

## 9. PERFORMANCE OPTIMIZATION

### 9.1 Database Indexes
```typescript
// Database index creation
const createIndexes = async () => {
  // User indexes
  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ username: 1 }, { unique: true });
  await User.collection.createIndex({ role: 1, isActive: 1 });

  // Flight indexes
  await Flight.collection.createIndex({ 
    departureAirportId: 1, 
    arrivalAirportId: 1, 
    departureTime: 1 
  });
  await Flight.collection.createIndex({ airlineId: 1, departureTime: 1 });
  await Flight.collection.createIndex({ status: 1, departureTime: 1 });
  await Flight.collection.createIndex({ flightNumber: 1 }, { unique: true });

  // Booking indexes
  await Booking.collection.createIndex({ userId: 1, createdAt: -1 });
  await Booking.collection.createIndex({ flightId: 1 });
  await Booking.collection.createIndex({ bookingReference: 1 }, { unique: true });
  
  console.log('Database indexes created');
};
```

### 9.2 Response Caching
```typescript
// src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any; timestamp: number }>();

export const cacheMiddleware = (duration: number = 300000) => { // 5 minutes default
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }
    
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

Questa documentazione backend fornisce una panoramica completa dell'implementazione del sistema, inclusi tutti i componenti principali, la sicurezza, le performance e le best practices utilizzate.