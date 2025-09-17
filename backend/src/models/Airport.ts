import mongoose, { Document, Schema } from 'mongoose';

export interface IAirport extends Document {
  name: string;
  code: string; // IATA code (e.g., 'FCO' for Rome Fiumicino)
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const airportSchema = new Schema<IAirport>({
  name: {
    type: String,
    required: [true, 'Airport name is required'],
    trim: true,
    maxlength: [100, 'Airport name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Airport code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    length: [3, 'Airport code must be exactly 3 characters'],
    match: [/^[A-Z]{3}$/, 'Airport code must contain only uppercase letters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [50, 'Country name cannot exceed 50 characters']
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    trim: true,
    match: [/^[A-Za-z]+\/[A-Za-z_]+$/, 'Please enter a valid timezone (e.g., Europe/Rome)']
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
airportSchema.index({ code: 1 });
airportSchema.index({ city: 1, country: 1 });
airportSchema.index({ country: 1 });
airportSchema.index({ isActive: 1 });
airportSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

export const Airport = mongoose.model<IAirport>('Airport', airportSchema);