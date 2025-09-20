import mongoose, { Document, Schema } from "mongoose";

export interface ISeatConfiguration {
  class: "economy" | "business" | "first";
  rows: number;
  seatsPerRow: number;
  seatLayout: string; // e.g., "3-3-3" for wide-body, "3-3" for narrow-body
  totalSeats: number;
}

export interface IAircraft extends Document {
  registrationNumber: string;
  airline: mongoose.Types.ObjectId;
  aircraftModel: string;
  manufacturer: string;
  yearManufactured: number;
  totalCapacity: number;
  seatConfiguration: ISeatConfiguration[];
  specifications: {
    maxRange: number; // in kilometers
    cruiseSpeed: number; // in km/h
    fuelCapacity: number; // in liters
    maxTakeoffWeight: number; // in kg
  };
  maintenance: {
    lastMaintenanceDate: Date;
    nextMaintenanceDate: Date;
    flightHours: number;
    cyclesCompleted: number;
  };
  status: "active" | "maintenance" | "retired" | "grounded";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seatConfigurationSchema = new Schema<ISeatConfiguration>(
  {
    class: {
      type: String,
      enum: ["economy", "business", "first"],
      required: true,
    },
    rows: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 row"],
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 seat per row"],
    },
    seatLayout: {
      type: String,
      required: true,
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 seat"],
    },
  },
  { _id: false }
);

const aircraftSchema = new Schema<IAircraft>(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{1,2}-[A-Z0-9]{3,6}$/,
        "Invalid registration number format",
      ],
    },
    airline: {
      type: Schema.Types.ObjectId,
      ref: "Airline",
      required: [true, "Airline is required"],
    },
    aircraftModel: {
      type: String,
      required: [true, "Aircraft model is required"],
      trim: true,
      maxlength: [100, "Model name cannot exceed 100 characters"],
    },
    manufacturer: {
      type: String,
      required: [true, "Manufacturer is required"],
      trim: true,
      maxlength: [50, "Manufacturer name cannot exceed 50 characters"],
    },
    yearManufactured: {
      type: Number,
      required: [true, "Year manufactured is required"],
      min: [1950, "Year must be 1950 or later"],
      max: [
        new Date().getFullYear() + 2,
        "Year cannot be more than 2 years in the future",
      ],
    },
    totalCapacity: {
      type: Number,
      required: [true, "Total capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    seatConfiguration: [seatConfigurationSchema],
    specifications: {
      maxRange: {
        type: Number,
        required: [true, "Max range is required"],
        min: [100, "Range must be at least 100 km"],
      },
      cruiseSpeed: {
        type: Number,
        required: [true, "Cruise speed is required"],
        min: [200, "Speed must be at least 200 km/h"],
      },
      fuelCapacity: {
        type: Number,
        required: [true, "Fuel capacity is required"],
        min: [100, "Fuel capacity must be at least 100 liters"],
      },
      maxTakeoffWeight: {
        type: Number,
        required: [true, "Max takeoff weight is required"],
        min: [1000, "Weight must be at least 1000 kg"],
      },
    },
    maintenance: {
      lastMaintenanceDate: {
        type: Date,
        required: [true, "Last maintenance date is required"],
      },
      nextMaintenanceDate: {
        type: Date,
        required: [true, "Next maintenance date is required"],
      },
      flightHours: {
        type: Number,
        default: 0,
        min: [0, "Flight hours cannot be negative"],
      },
      cyclesCompleted: {
        type: Number,
        default: 0,
        min: [0, "Cycles cannot be negative"],
      },
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "retired", "grounded"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation
aircraftSchema.pre("save", function (next) {
  // Validate that next maintenance is after last maintenance
  if (
    this.maintenance.nextMaintenanceDate <= this.maintenance.lastMaintenanceDate
  ) {
    const error = new Error(
      "Next maintenance date must be after last maintenance date"
    );
    return next(error);
  }

  // Calculate total capacity from seat configuration
  if (this.seatConfiguration && this.seatConfiguration.length > 0) {
    const calculatedCapacity = this.seatConfiguration.reduce(
      (total, config) => {
        return total + config.totalSeats;
      },
      0
    );

    if (this.totalCapacity !== calculatedCapacity) {
      this.totalCapacity = calculatedCapacity;
    }
  }

  next();
});

// Indexes for efficient queries
aircraftSchema.index({ registrationNumber: 1 });
aircraftSchema.index({ airline: 1 });
aircraftSchema.index({ aircraftModel: 1 });
aircraftSchema.index({ manufacturer: 1 });
aircraftSchema.index({ status: 1 });
aircraftSchema.index({ isActive: 1 });
aircraftSchema.index({ "maintenance.nextMaintenanceDate": 1 });

export const Aircraft = mongoose.model<IAircraft>("Aircraft", aircraftSchema);
