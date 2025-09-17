import mongoose, { Document, Schema } from 'mongoose';

export interface IPassenger {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  passportNumber?: string;
  seatNumber: string;
  seatClass: 'economy' | 'business' | 'first';
  specialRequests?: string[];
}

export interface IBooking extends Document {
  bookingReference: string;
  user: mongoose.Types.ObjectId;
  flight: mongoose.Types.ObjectId;
  passengers: IPassenger[];
  contactInfo: {
    email: string;
    phone: string;
  };
  pricing: {
    basePrice: number;
    taxes: number;
    fees: number;
    extras: {
      name: string;
      price: number;
    }[];
    totalPrice: number;
  };
  payment: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: Date;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  checkedIn: boolean;
  checkedInAt?: Date;
  baggage: {
    carryOn: number;
    checked: number;
    extraBags: number;
  };
  specialServices: {
    wheelchairAssistance: boolean;
    specialMeal?: string;
    unaccompaniedMinor: boolean;
    petTransport: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const passengerSchema = new Schema<IPassenger>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  nationality: {
    type: String,
    required: [true, 'Nationality is required'],
    trim: true,
    maxlength: [50, 'Nationality cannot exceed 50 characters']
  },
  passportNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  seatNumber: {
    type: String,
    required: [true, 'Seat number is required'],
    trim: true
  },
  seatClass: {
    type: String,
    enum: ['economy', 'business', 'first'],
    required: [true, 'Seat class is required']
  },
  specialRequests: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const bookingSchema = new Schema<IBooking>({
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{6}$/, 'Booking reference must be 6 alphanumeric characters']
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  flight: {
    type: Schema.Types.ObjectId,
    ref: 'Flight',
    required: [true, 'Flight is required']
  },
  passengers: {
    type: [passengerSchema],
    required: [true, 'At least one passenger is required'],
    validate: {
      validator: function(passengers: IPassenger[]) {
        return passengers.length > 0 && passengers.length <= 9;
      },
      message: 'Must have between 1 and 9 passengers'
    }
  },
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    taxes: {
      type: Number,
      required: [true, 'Taxes amount is required'],
      min: [0, 'Taxes cannot be negative']
    },
    fees: {
      type: Number,
      required: [true, 'Fees amount is required'],
      min: [0, 'Fees cannot be negative']
    },
    extras: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      }
    }],
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  baggage: {
    carryOn: {
      type: Number,
      required: true,
      min: [0, 'Cannot be negative'],
      max: [2, 'Maximum 2 carry-on bags allowed']
    },
    checked: {
      type: Number,
      required: true,
      min: [0, 'Cannot be negative'],
      max: [5, 'Maximum 5 checked bags allowed']
    },
    extraBags: {
      type: Number,
      default: 0,
      min: [0, 'Cannot be negative']
    }
  },
  specialServices: {
    wheelchairAssistance: {
      type: Boolean,
      default: false
    },
    specialMeal: {
      type: String,
      trim: true,
      enum: ['', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'diabetic', 'low-sodium']
    },
    unaccompaniedMinor: {
      type: Boolean,
      default: false
    },
    petTransport: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

// Indexes for efficient queries
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ flight: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);