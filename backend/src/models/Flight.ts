import mongoose, { Document, Schema } from 'mongoose';

export interface ISeat {
  seatNumber: string;
  class: 'economy' | 'business' | 'first';
  isAvailable: boolean;
  price: number;
}

export interface IFlight extends Document {
  flightNumber: string;
  airline: mongoose.Types.ObjectId;
  departureAirport: mongoose.Types.ObjectId;
  arrivalAirport: mongoose.Types.ObjectId;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // in minutes
  aircraft: {
    model: string;
    capacity: number;
  };
  seats: ISeat[];
  basePrice: {
    economy: number;
    business: number;
    first: number;
  };
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'delayed';
  gate?: string;
  terminal?: string;
  baggage: {
    carryOn: {
      maxWeight: number; // kg
      maxDimensions: string; // e.g., "55x40x20 cm"
    };
    checked: {
      included: number; // number of free checked bags
      maxWeight: number; // kg per bag
      extraBagPrice: number; // price for additional bags
    };
  };
  services: {
    meal: boolean;
    wifi: boolean;
    entertainment: boolean;
    extraLegroom: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seatSchema = new Schema<ISeat>({
  seatNumber: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    enum: ['economy', 'business', 'first'],
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

const flightSchema = new Schema<IFlight>({
  flightNumber: {
    type: String,
    required: [true, 'Flight number is required'],
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{2}\d{3,4}$/, 'Flight number must follow format: XX123 or XX1234']
  },
  airline: {
    type: Schema.Types.ObjectId,
    ref: 'Airline',
    required: [true, 'Airline is required']
  },
  departureAirport: {
    type: Schema.Types.ObjectId,
    ref: 'Airport',
    required: [true, 'Departure airport is required']
  },
  arrivalAirport: {
    type: Schema.Types.ObjectId,
    ref: 'Airport',
    required: [true, 'Arrival airport is required']
  },
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required']
  },
  arrivalTime: {
    type: Date,
    required: [true, 'Arrival time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Flight duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  aircraft: {
    model: {
      type: String,
      required: [true, 'Aircraft model is required'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Aircraft capacity is required'],
      min: [1, 'Capacity must be at least 1']
    }
  },
  seats: [seatSchema],
  basePrice: {
    economy: {
      type: Number,
      required: [true, 'Economy base price is required'],
      min: [0, 'Price cannot be negative']
    },
    business: {
      type: Number,
      required: [true, 'Business base price is required'],
      min: [0, 'Price cannot be negative']
    },
    first: {
      type: Number,
      required: [true, 'First class base price is required'],
      min: [0, 'Price cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  gate: {
    type: String,
    trim: true
  },
  terminal: {
    type: String,
    trim: true
  },
  baggage: {
    carryOn: {
      maxWeight: {
        type: Number,
        required: true,
        min: [0, 'Weight cannot be negative']
      },
      maxDimensions: {
        type: String,
        required: true,
        trim: true
      }
    },
    checked: {
      included: {
        type: Number,
        required: true,
        min: [0, 'Cannot be negative']
      },
      maxWeight: {
        type: Number,
        required: true,
        min: [0, 'Weight cannot be negative']
      },
      extraBagPrice: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      }
    }
  },
  services: {
    meal: {
      type: Boolean,
      default: false
    },
    wifi: {
      type: Boolean,
      default: false
    },
    entertainment: {
      type: Boolean,
      default: false
    },
    extraLegroom: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validation: arrival time must be after departure time
flightSchema.pre('save', function(next) {
  if (this.arrivalTime <= this.departureTime) {
    next(new Error('Arrival time must be after departure time'));
  } else {
    next();
  }
});

// Indexes for efficient queries
flightSchema.index({ flightNumber: 1, departureTime: 1 });
flightSchema.index({ airline: 1 });
flightSchema.index({ departureAirport: 1, arrivalAirport: 1 });
flightSchema.index({ departureTime: 1 });
flightSchema.index({ status: 1 });
flightSchema.index({ isActive: 1 });

export const Flight = mongoose.model<IFlight>('Flight', flightSchema);