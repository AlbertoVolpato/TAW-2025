import mongoose, { Document, Schema } from "mongoose";

export interface IRoute extends Document {
  routeCode: string;
  airline: mongoose.Types.ObjectId;
  origin: mongoose.Types.ObjectId;
  destination: mongoose.Types.ObjectId;
  distance: number; // in kilometers
  estimatedDuration: number; // in minutes
  operatingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  seasonality: {
    startDate: Date;
    endDate: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const routeSchema = new Schema<IRoute>(
  {
    routeCode: {
      type: String,
      required: [true, "Route code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}\d{3,4}$/,
        "Route code must follow format: XX123 or XX1234",
      ],
    },
    airline: {
      type: Schema.Types.ObjectId,
      ref: "Airline",
      required: [true, "Airline is required"],
    },
    origin: {
      type: Schema.Types.ObjectId,
      ref: "Airport",
      required: [true, "Origin airport is required"],
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: "Airport",
      required: [true, "Destination airport is required"],
    },
    distance: {
      type: Number,
      required: [true, "Distance is required"],
      min: [1, "Distance must be at least 1 km"],
    },
    estimatedDuration: {
      type: Number,
      required: [true, "Estimated duration is required"],
      min: [30, "Duration must be at least 30 minutes"],
    },
    operatingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: true },
    },
    seasonality: {
      startDate: {
        type: Date,
        required: [true, "Season start date is required"],
      },
      endDate: {
        type: Date,
        required: [true, "Season end date is required"],
      },
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
routeSchema.pre("save", function (next) {
  // Check if origin and destination are the same
  if (this.origin.equals(this.destination)) {
    const err = new Error("Origin and destination cannot be the same");
    return next(err);
  }

  // Validate season dates if specified
  if (this.seasonality.endDate <= this.seasonality.startDate) {
    const err = new Error("Season end date must be after start date");
    return next(err);
  }

  next();
});

// Indexes for efficient queries
routeSchema.index({ routeCode: 1 });
routeSchema.index({ airline: 1 });
routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ isActive: 1 });
routeSchema.index({ "seasonality.startDate": 1, "seasonality.endDate": 1 });

export const Route = mongoose.model<IRoute>("Route", routeSchema);
